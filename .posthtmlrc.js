const path = require("path");
const extend = require("posthtml-extend");
const expressions = require("posthtml-expressions");

const templatesRoot = path.join(__dirname, "src/templates");
const appVersion = process.env.npm_package_version;
const ogImageUrl = `https://assets.sembark.com/images/og-image.png?v=${appVersion}`;

module.exports = {
  plugins: [
    extend({
      root: templatesRoot,
    }),
    expressions({
      locals: {
        version: process.env.npm_package_version,
        title: "Sembark Tech Pvt Ltd - The Travel Software",
        appName: "Sembark",
        description:
          "Manage travel sales, operations and accounting with Sembark. Get 1-click quotation, smart operations and accounting, and all you need for a modern travel business.",
        keywords:
          "tour agency software, travel agency software, tour operator software, dmc management software, travel operator software, sass software, cloud base software, top 10 travel software, best travel agency software, best tour operator software, affordable tour software, sambark, sembak, sambak",
        publicUrl: "https://sembark.com",
        ogImageUrl,
        twitterUsername: "@SembarkTech",
        fbAppId: "596194027695907",
        gaId: "UA-169640999-1",
      },
    }),
  ],
};
