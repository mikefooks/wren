"use strict";

var path = require("path"), 
  fs = require("fs"),
  _ = require("lodash"),
  Q = require("q"),
  mkdirp = require("mkdirp"),
  uuid = require("node-uuid");

var CWD = process.cwd();

var qMkDirP = Q.nfbind(mkdirp),
  qFsWriteFile = Q.nfbind(fs.writeFile);

var config = {
  publicFolder: path.join(CWD, "public"),
  contentFolder: path.join(CWD, "content"),
  author: "Mike Fooks"
};

var contentDir = _.partial(path.join, config.contentFolder);

function slugify (str) {
  return _.snakeCase(str.replace(/[^\w\s]/g, ""));
}

function nameContentFolder(frontmatter) {
  var dateString = frontmatter.created
    .substring(0, 10)
    .replace(/\-/g, "_");

  return [dateString, frontmatter.slug].join("_");
}

function createDefaultFrontMatter (title) {
  var created = new Date().toISOString(),
    frontmatter = {
      id: uuid.v4(),
      title: title,
      author: config.author,
      slug: slugify(title),
      created: created,
      modified: created,
      keywords: [],
      update: true
    };

  return Q.resolve(frontmatter);
}

function createNewPost (title) {
  return createDefaultFrontMatter(title)
    // Create the directory
    .tap(_.flow(nameContentFolder, contentDir, qMkDirP))
    // Write the frontmatter.json file to the directory
    .then(frontmatter => {
      return Q.all([
        qFsWriteFile(
          contentDir(nameContentFolder(frontmatter), "frontmatter.json"), 
          JSON.stringify(frontmatter, null, '\t')),
        qFsWriteFile(
          contentDir(nameContentFolder(frontmatter), "main.md"),
          "<!-- Write your post here! -->")]);
    });
}

module.exports = {
  createNewPost: createNewPost
};