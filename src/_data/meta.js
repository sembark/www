const appVersion = process.env.npm_package_version;
const appEnv = process.env.NODE_ENV;
const ogImageUrl = `https://assets.sembark.com/images/og-image.png?v=${appVersion}`;
module.exports = {
  appEnv,
  siteURL: process.env.URL || "http://localhost:8080",
  version: appVersion,
  appName: "Sembark",
  siteName: "Sembark Tech Pvt Ltd - The Travel Software",
  description:
    "Manage travel sales, operations and accounting with Sembark. Get 1-click quotation, smart operations and accounting, and all you need for a modern travel business.",
  keywords:
    "sembark pvt ltd, sembark tech pvt ltd,sembark technology private limited,semark technologies,tour agency software, travel agency software, tour operator software, dmc management software, travel operator software, sass software, cloud base software, top 10 travel software, best travel agency software, best tour operator software, affordable tour software, sambark, sembak, sambak",
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
