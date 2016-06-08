"use strict";

let _ = require("lodash"),
  Q = require("q"),
  fs = require("fs");

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

function copyFile (source, target) {
  return Q.Promise(function (resolve, reject) {
    let reader = fs.createReadStream(source),
      writer = fs.createWriteStream(target)

    reader.on("end", function () {
      resolve();
    });

    reader.pipe(writer)
  });
}


module.exports = {
  slugify,
  nameContentFolder,
  copyFile
};
