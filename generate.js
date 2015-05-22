"use strict";

var fs = require("fs"),
  path = require("path"),
  async = require("async"),
  marked = require("marked"),
  _ = require("lodash");

var mainContentDir = path.join(process.cwd(), "content");

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true
});

function prependSubDir (dirName) {
  return _.partial(path.join, mainContentDir, dirName);
}

function parseFrontmatter (path) {
  var frontMatter = fs.readFileSync(path, { encoding: "utf8" });
  return JSON.parse(frontMatter);
}

function compileMarkdown (path) {
  var rawMarkdown = fs.readFileSync(path, { encoding: "utf8" });
  return marked(rawMarkdown);
}

async.waterfall([
  // Reads the main content directory, and passes along the names
  // of the content subfolders (articles).
  function (cb) {
    fs.readdir(mainContentDir, function (err, stat) {
        cb(null, stat);
    });
  },
  function (dirs, cb) {
    async.mapLimit(dirs, 5, function (dir, cb) {
      var prepend = prependSubDir(dir);

      cb({
        frontmatter: parseFrontmatter(prepend("frontmatter.json")),
        main: compileMarkdown(prepend("main.md"))
      });
    }, cb);
  }], function (err, result) {
    if (err) { return console.log(err); }

    console.log(result);
});