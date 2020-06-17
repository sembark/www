# Sembark Marketing Website

## Scripts

This project uses [Parcel](https://parceljs.org/getting_started.html) for bundling the website.

### Local Developement

```
npm run dev
```

> We need to append the `.html` at the end of the urls i.e. http://localhost:1234/index.html to open the home page.

### Production Build

```
npm run build
```

## Directory Structure

**public** => All the public assets. Files from this folder will be copied to `dist` folder.

**src/pages** => Pages for the website.

**src/components** => HTML Reusable components. These components gets resolved with _posthtml-modules_ plugin.

**src/styles.css** => Styles for the website. Website uses the [Tailwind CSS](https://tailwindcss.com) utility first css
framework.

**tailwind.config.js** => Configuration file for tailwind.
