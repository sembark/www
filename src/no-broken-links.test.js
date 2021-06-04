const fetch = require("node-fetch");
const cliProgress = require("cli-progress");
const { parse } = require("node-html-parser");
const _colors = require("colors");

const MAX_ACTIVE_PAGES = 100;

/** @type {Array<string>} */
const checkedUrls = [];
/** @type {Array<[url:string, error:Error, parentUrl: string|undefined]>} */
const invalidURls = [];

const BASE_URL = process.env.APP_PUBLIC_URL || "http://localhost:8080";

async function inspectSitemap(sitemapUrl = `${BASE_URL}/sitemap.xml`) {
  console.log(`Inspecting sitemap from ${sitemapUrl}...`);
  let text = "";
  try {
    text = await getPageContent(sitemapUrl);
  } catch (e) {
    console.log(
      _colors.yellow(
        `Unable to access the sitemap at ${sitemapUrl}. Please check if your server is running`
      )
    );
    console.log(_colors.red(e.message));
    process.exit(1);
  }
  const xml = parse(text);
  const locs = xml.querySelectorAll("loc");
  const urls = locs.map((loc) => loc.innerText);
  await Promise.all(
    urls.map((url) => {
      return checkPageIncludingSubPage(url, null);
    })
  );
  closeAllPage();
  let urlsWithMajorIssue = [];
  if (!invalidURls.length) {
    console.log(_colors.bgGreen("All links working properly"));
    return;
  } else {
    console.log("\n\n--------");
    console.log(
      _colors.yellow("Following urls have issues but can be ignored")
    );
    for (let [url, err, parentUrl] of invalidURls) {
      if (url.indexOf(BASE_URL) === -1) {
        // this page is not hosted on this page
        // can be ignored
        console.log(
          _colors.yellow(
            `${url} [parent:${parentUrl || BASE_URL}]\n   ==> ${err.message}`
          )
        );
      } else {
        urlsWithMajorIssue.push([url, err, parentUrl]);
      }
    }
    if (urlsWithMajorIssue.length) {
      console.log("\n\n---------------");
      console.log(
        _colors.red("Following urls have issues and must be resolved")
      );
      for (let [url, err, parentUrl] of urlsWithMajorIssue) {
        console.log(
          _colors.red(
            `${url} [parent:${parentUrl || BASE_URL}]\n   ==> ${err.message}`
          )
        );
      }
      console.log("\n");
      process.exit(1);
    }
  }
}
(async () => await inspectSitemap())();

/**
 * @param {string} url Url of the current page
 * @param {string|null} parentUrl Parent url
 */
async function checkPageIncludingSubPage(url, parentUrl) {
  const sanitizedUrl = sanitizeUrl(url, parentUrl);
  if (checkedUrls.indexOf(sanitizedUrl || url) !== -1) {
    return;
  }
  checkedUrls.push(sanitizedUrl || url);
  if (!sanitizedUrl) {
    logInfo(url, `Skipped`);
    return;
  }
  const pageText = await withPageOpen(sanitizedUrl, async () => {
    try {
      const resp = await getPageContent(sanitizedUrl);
      if (!resp) {
        throw new Error(`No response from ${sanitizedUrl}`);
      }
      return resp;
    } catch (e) {
      invalidURls.push([sanitizedUrl, e, parentUrl]);
      throw e;
    }
  });
  if (sanitizedUrl && sanitizedUrl.indexOf(BASE_URL) === -1) {
    logInfo(sanitizedUrl, `Skipped sub-page`);
    return;
  }
  if (!pageText) return;
  // get all the pages
  const hrefs = getLinksFromHTMLText(pageText);
  if (hrefs && hrefs.length) {
    logInfo(
      sanitizedUrl,
      `${hrefs.length} link${hrefs.length > 1 ? "s" : ""} on`
    );
    await Promise.all(
      hrefs.map((href) => checkPageIncludingSubPage(href, sanitizedUrl))
    );
  }
}

const pages = [];
// create new container
const multibar = new cliProgress.MultiBar({
  forceRedraw: true,
  format: (options, params, payload) => {
    return `${payload.status} : ${payload.url}`;
  },
});

function logInfo(url, info) {
  const bar = multibar.create(1, 1, { url: url, status: _colors.dim(info) });
  pages.push({
    bar,
    url: url,
  });
}

function closeAllPage() {
  for (let page of pages) {
    page.bar.stop();
  }
  multibar.stop();
}

let activePagesCount = 0;

/**
 * Open a new page/tab
 *
 * @param {string} url Url of the page
 * @param {(onError: () => void, onSuccess: () => void) => Promise<T>} handlePage Handle this new page
 * @return {Promise<T>}
 */
async function withPageOpen(url, handlePage) {
  if (activePagesCount < MAX_ACTIVE_PAGES) {
    activePagesCount++;
    const page = {
      bar: multibar.create(1, 0, { url, status: "Checking..." }),
      url: url,
    };
    pages.push(page);
    let handlePageReturnValue = null;
    try {
      handlePageReturnValue = await handlePage();
      page.bar.update(1, {
        url: url,
        status: _colors.green("All Good"),
      });
    } catch (error) {
      page.bar.update(1, {
        url: url,
        status: _colors.red("Failed  "),
      });
    }
    page.url = null;
    page.bar.stop();
    activePagesCount--;
    return handlePageReturnValue;
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(withPageOpen(url, handlePage));
    }, 100);
  });
}

/**
 * @param {string} url Url on the page
 */
async function getPageContent(url) {
  return fetch(url)
    .then((resp) => {
      if (resp.ok) {
        // res.status >= 200 && res.status < 300
        return resp;
      } else {
        throw new Error(resp.statusText);
      }
    })
    .then((resp) => resp.text());
}

function getLinksFromHTMLText(htmlText) {
  try {
    const xml = parse(htmlText);
    const anchorElms = xml.querySelectorAll("a");
    if (!anchorElms) return [];
    const urls = anchorElms.map((a) => a.getAttribute("href"));
    return urls.filter(Boolean);
  } catch (e) {
    return [];
  }
}

/**
 * Sanitize a given url
 * @param {string} url Url to sanitize
 * @param {string} parentUrl Parent url used for relative (starts without slash)
 * @return {string|null}
 */
function sanitizeUrl(url, parentUrl) {
  if (!parentUrl) {
    parentUrl = BASE_URL;
  }
  if (!isUrlInsepctable(url)) {
    return null;
  }
  if (!url.startsWith("http")) {
    if (url.startsWith("/")) {
      // "/about" => "http://localhost/about"
      url = `${BASE_URL}${url}`;
    } else {
      // parentUrl == "http://localhost/legal"
      // "terms" => "http://localhost/parentUrl/terms"
      if (parentUrl.endsWith("/")) {
        url = `${parentUrl}${url}`;
      } else {
        url = `${parentUrl}/${url}`;
      }
    }
  }
  // remove #hash
  return url.replace(/#.*$/g, "");
}

function isUrlInsepctable(url) {
  if (
    url.startsWith("tel") ||
    url.startsWith("sms") ||
    url.startsWith("mailto") ||
    url.indexOf("javascript:void") !== -1
  ) {
    return false;
  }
  return true;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
