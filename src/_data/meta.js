const appVersion = process.env.npm_package_version;
const appEnv = process.env.NODE_ENV;
const ogImageUrl = `https://assets.sembark.com/images/og-image.png?v=${appVersion}`;
module.exports = {
  appEnv,
  siteURL: process.env.URL || "http://localhost:8080",
  version: appVersion,
  appName: "Sembark",
  siteName: "Sembark - The Travel Management Software",
  description:
    "Manage travel sales, reservation and accounting with Sembark and get 1-click quotation, smart calendar reservation and accounting with expense management",
  keywords: [
    "travel software",
    "travel management",
    "tour management",
    "online software",
    "best travel software",
    "lead management",
    "multiple sources queries",
    "hotel bookings and reservation",
    "cab scheduling",
    "calendar bookings",
    "payments",
    "finance",
    "expense management",
    "income management ",
  ].join(","),
  lang: "en",
  locale: "en_in",
  authorName: "Sudhir Mitharwal",
  authorEmail: "sudhir@sembark.com",
  ogImageUrl,
  twitterCreator: "@sudhirmith",
  twitterUsername: "@SembarkTech",
  gaMeasurementId: "G-2DEQQHZL6V",
  publicUrl: "https://sembark.com",
  address: {
    name: "Sembark Tech. Pvt. Ltd",
    street: "Vaisali Nagar",
    city: "Jaipur",
    state: "Rajasthan",
    zip: "302012",
    phoneDisplay: "+91-9005505374",
    phoneCall: "+919005505374",
    secondaryPhoneDisplay: "8950392425",
    secondaryPhoneCall: "+918950392425",
    email: "contact@sembark.com",
    landmark: "Akshardham Temple",
    country: "India",
  },
};
