const colors = require("tailwindcss/colors");
module.exports = {
  purge: [
    "./src/**/*.html",
    "./src/**/*.njk",
    "./src/**/*.md",
    "./src/_data/colors.js",
    "./src/_data/structure.js",
  ],
  mode: "jit",
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
            hr: {
              borderTopWidth: "2px",
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
