const path = require("path");

module.exports = {
  plugins: [
    require("posthtml-modules")({
      root: path.join(__dirname, "src/components"),
    }),
  ],
};
