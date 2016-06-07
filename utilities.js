"use strict";

let _ = require("lodash");

/*
  UTILITIES
 */

function slugify (str) {
  return _.snakeCase(str.replace(/[^\w\s]/g, ""));
}

function nameContentFolder(frontmatter) {
  let dateString = frontmatter.created
    .substring(0, 10)
    .replace(/\-/g, "_");

  return [dateString, frontmatter.slug].join("_");
}

module.exports = {
  slugify,
  nameContentFolder
};
