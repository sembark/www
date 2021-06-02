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
            color: colors.indigo["200"],
            h1: { color: colors.indigo["50"] },
            strong: { color: colors.indigo["50"] },
            b: { color: colors.indigo["50"] },
            th: { color: colors.indigo["50"] },
            h2: { color: colors.indigo["50"] },
            h3: { color: colors.indigo["100"] },
            blockquote: { color: colors.indigo["100"] },
            a: {
              color: colors.lightBlue["100"],
              "&:hover": {
                color: colors.lightBlue["50"],
              },
            },
            ol: {
              "> li::before": {
                color: colors.indigo["300"],
              },
            },
            ul: {
              "> li::before": {
                backgroundColor: colors.indigo["300"],
              },
            },
            hr: {
              borderColor: colors.indigo["800"],
              borderTopWidth: "2px",
            },
            thead: {
              borderBottomColor: colors.indigo["100"],
              borderBottomWidth: "2px",
            },
            "tbody tr": {
              borderBottomColor: colors.indigo["200"],
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
