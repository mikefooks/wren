"use strict";

var path = require("path"), 
  fs = require("fs"),
  _ = require("lodash"),
  Q = require("q"),
  mkdirp = require("mkdirp");

var CWD = process.cwd();

var qMkDirP = Q.nfbind(mkdirp),
  qFsWriteFile = Q.nfbind(fs.writeFile);

var config = {
  publicFolder: "./public",
  contentFolder: "./content",
  author: "Mike Fooks"
};

var contentDir = _.partial(path.join, config.contentFolder);

function slugify (str) {
  return _.snakeCase(str.replace(/[^\w\s]/g, ""));
}

function createDefaultFrontMatter (title) {
  return Q.resolve({
    title: title,
    author: config.author,
    slug: slugify(title),
    created: new Date(),
    keywords: [],
    update: true
  });
}

function createContentFolder (title) {
  return createDefaultFrontMatter(title)
    .tap(frontmatter => qMkDirP(contentDir(frontmatter.slug)))
    .then(frontmatter => {
      return qFsWriteFile(
        contentDir(frontmatter.slug, "frontmatter.json"), 
        JSON.stringify(frontmatter));
    });
}

module.exports = {
  createContentFolder: createContentFolder
};