"use strict";

var fs = require("fs"),
  path = require("path"),
  async = require("async"),
  marked = require("marked"),
  _ = require("lodash");

var contentDir = path.join(process.cwd(), "content");

async.waterfall([
  // Reads the main content directory, and passes along the names
  // of the content subfolders (articles).
  function (cb) {
    fs.readdir(contentDir, function (err, stat) {
        cb(null, stat);
    });
  },
  // Takes the name of each article directory and creates a 
  // collection of objects with full paths to the markdown
  // and frontmatter.json files.
  function (dirs, cb) {
    cb(null, _.map(articleDirs, function (dir) {
      var dirName = path.join(contentDir, dir);

      return {
        frontMatter: path.join(dirName, "frontmatter.json"),
        main: path.join(dirName, "main.md")
      };
    }));
  },
  function (content, cb) {
    var 
  }], function (err, result) {
    if (err) { return console.log(err); }

    console.log(result);
});