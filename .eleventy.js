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
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");
  eleventyConfig.addPassthroughCopy("src/assets/images/");
  eleventyConfig.addPassthroughCopy("src/assets/svg/");
  /**
   * Add layout aliases
   * @link https://www.11ty.dev/docs/layouts/#layout-aliasing
   */
  eleventyConfig.addLayoutAlias("base", "layouts/base.njk");
  eleventyConfig.addLayoutAlias("main", "layouts/main.njk");
  eleventyConfig.addLayoutAlias("blog", "layouts/blog.njk");
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
