const sitemap = require("@quasibit/eleventy-plugin-sitemap");
const htmlmin = require("html-minifier");

module.exports = function (eleventyConfig) {
  /**
   * Custom Watch Targets
   * for when the Tailwind config or .css files change...
   * by default not watched by 11ty
   * @link https://www.11ty.dev/docs/config/#add-your-own-watch-targets
   */
  eleventyConfig.addWatchTarget("./src/assets");
  eleventyConfig.addWatchTarget("./tailwind.config.js");
  /**
   * Passthrough File Copy
   * @link https://www.11ty.dev/docs/copy/
   */
  eleventyConfig.addPassthroughCopy("src/*.png");
  eleventyConfig.addPassthroughCopy("src/*.jpg");
  eleventyConfig.addPassthroughCopy("src/*.ico");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/assets/images/");
  eleventyConfig.addPassthroughCopy("src/assets/svg/");
  eleventyConfig.addPassthroughCopy("src/assets/covid/");
  /**
   * Add layout aliases
   * @link https://www.11ty.dev/docs/layouts/#layout-aliasing
   */
  eleventyConfig.addLayoutAlias("base", "layouts/base.njk");
  eleventyConfig.addLayoutAlias("main", "layouts/main.njk");
  eleventyConfig.addLayoutAlias("blog", "layouts/blog.njk");
  eleventyConfig.addLayoutAlias(
    "covidDistrictSlots",
    "layouts/covid/district-slots.njk"
  );
  eleventyConfig.addPlugin(sitemap, {
    // Name of the property for the last modification date.
    // By default it is undefined and the plugin will fallback to `date`.
    // When set, the plugin will try to use this property and it will fallback
    // to the `date` property when needed.
    lastModifiedProperty: "modified",
    sitemap: {
      hostname: "https://sembark.com",
    },
  });

  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    // Eleventy 1.0+: use this.inputPath and this.outputPath instead
    if (outputPath && outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyJs: true,
        minifyCSS: true,
      });
      return minified;
    }

    return content;
  });
  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes",
      data: "_data",
    },
    passthroughFileCopy: true,
    templateFormats: ["html", "njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
