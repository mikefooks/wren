"use strict";

module.exports = {
  rootUrl: "http://localhost/blog",
  responsiveImages: [
    { size: "small", breakpoint: 0, width: 400 },
    { size: "medium", breakpoint: 480, width: 600 },
    { size: "large", breakpoint: 860, width: 1000 }
  ],
  contentDir: path.join(__dirname, "content"),
  publicDir: path.join(__dirname, "public"),
  themeDir: path.join(__dirname, "theme")
};
