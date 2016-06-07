"use strict";


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
