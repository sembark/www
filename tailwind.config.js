const colors = require("tailwindcss/colors");
module.exports = {
  purge: [
    "./src/**/*.html",
    "./src/**/*.njk",
    "./src/**/*.md",
    "./src/_data/colors.js",
    "./src/_data/structure.js",
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    colors: {
      transparent: "transparent",
      currentColor: "currentColor",
      ...colors,
    },
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: colors.indigo["100"],
            h1: { color: colors.indigo["50"] },
            h2: { color: colors.indigo["50"] },
            a: {
              color: colors.lightBlue["100"],
              "&:hover": {
                color: colors.lightBlue["50"],
              },
            },
          },
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
