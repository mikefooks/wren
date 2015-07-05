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

function nameContentFolder(frontmatter) {
  var dateString = frontmatter.created
    .toISOString()
    .substring(0, 10)
    .replace(/\-/g, "_");

  return [dateString, frontmatter.slug].join("_");
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
    .tap(frontmatter => qMkDirP(contentDir(nameContentFolder(frontmatter))))
    .then(frontmatter => {
      return qFsWriteFile(
        contentDir(nameContentFolder(frontmatter), "frontmatter.json"), 
        JSON.stringify(frontmatter, null, '\t'));
    });
}

module.exports = {
  createContentFolder: createContentFolder
};