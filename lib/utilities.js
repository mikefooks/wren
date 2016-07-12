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
  copyFile
};
