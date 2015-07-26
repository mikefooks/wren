"use strict";

var path = require("path"),
  fs = require("fs"),
  _ = require("lodash"),
  Q = require("q"),
  program = require("commander"),
  G = require("./generate.js"),
  mkdirp = require("mkdirp"),
  rimraf = require("rimraf"),
  uuid = require("node-uuid");

var CWD = process.cwd();

var qMkDirP = Q.nfbind(mkdirp),
  qRimraf = Q.nfbind(rimraf),
  qFsReadFile = Q.nfbind(fs.readFile),
  qFsWriteFile = Q.nfbind(fs.writeFile);

var config = {
  publicFolder: path.join(CWD, "public"),
  contentFolder: path.join(CWD, "content"),
  author: "Mike Fooks"
};

var contentDir = _.partial(path.join, config.contentFolder);

program
  .version("0.0.1")
  .option("new <s>", "Creates a new post", createNewPost)
  .option("delete <s>", "Deletes a post", deletePost)
  .option("generate", "Generates!", G.generateUpdated)
  .parse(process.argv);


/*
  UTILITIES
 */

function slugify (str) {
  return _.snakeCase(str.replace(/[^\w\s]/g, ""));
}

function nameContentFolder(frontmatter) {
  var dateString = frontmatter.created
    .substring(0, 10)
    .replace(/\-/g, "_");

  return [dateString, frontmatter.slug].join("_");
}

/*
 PROMISE-RETURNING FUNCTIONS
 */

/**
 * Is fed the title through the cli's new command and builds an object
 * which will ultimately become the new post's frontmatter.json file.
 * @param  { String } title   The String title for the new post.
 * @return { Q Promise }      A fulfilled Q promise bearing the new
 *                            frontmatter object.
 */
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
    .tap(_.flow(nameContentFolder, contentDir, qMkDirP))
    .then(frontmatter =>
      Q.all([
        qMkDirP(contentDir(nameContentFolder(frontmatter), "images")),
        qFsWriteFile(
          contentDir(nameContentFolder(frontmatter), "frontmatter.json"),
          JSON.stringify(frontmatter, null, '\t')),
        qFsWriteFile(
          contentDir(nameContentFolder(frontmatter), "main.md"),
          "<!-- Write your post here! -->")
      ])
    );
}

function deletePost (dir) {
  var contentPath = path.join(config.contentFolder, dir);

  return qFsReadFile(path.join(contentPath, "frontmatter.json"))
    .then(fm => {
      var slug = JSON.parse(fm).slug;

      return Q.all([
        qRimraf(contentPath),
        qRimraf(path.join(config.publicFolder, slug))
      ]);
    });
}
