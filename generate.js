"use strict";

var fs = require("fs"),
  path = require("path"),
  url = require("url"),
  _ = require("lodash"),
  H = require("./helpers.js"),
  Q = require("q"),
  marked = require("marked"),
  ejs = require("ejs"),
  rimraf = require("rimraf"),
  mkdirp = require("mkdirp");

var config = {
  rootUrl: "http://localhost/"
};

var CWD = process.cwd(), 
  contentDir = path.join(CWD, "content"),
  publicDir = path.join(CWD, "public"),
  themeDir = path.join(CWD, "theme");

console.log(publicDir);

var readFile = _.partialRight(fs.readFileSync, "utf8"),
  parseJSON = _.flow(readFile, JSON.parse),
  compileMarkdown = _.flow(readFile, marked);

var qReadDir = Q.nfbind(fs.readdir),
  qMkDir = Q.nfbind(fs.mkdir),
  qFsExists = Q.nfbind(fs.exists),
  qMkDirP = Q.nfbind(mkdirp),
  qFsWriteFile = Q.nfbind(fs.writeFile);

marked.setOptions({
  breaks: false,
  gfm: true,
  smartypants: true
});

function compileTemplate (template, context) {
  return ejs.compile(template)(context);
}

/**
 * Builds a collection of objects representing all the posts to be updated,
 * and all the necessary properties required to generate the html files 
 * and directories for said posts.
 * @param  {Array} posts  An array of directory names (strings) from the 
 *                        content folder
 * @return {Q Promise}    A fulfilled promise whose value is a collection of 
 *                        post objects.
 */
function buildPostCollection (posts) {
  return Q.resolve(_.map(posts, post => {
    var dir = path.join(contentDir, post),
      frontmatter = parseJSON(path.join(dir, "frontmatter.json"));

    frontmatter.created = new Date(frontmatter.created);
    frontmatter.modified = new Date();

    return {
      frontmatter: frontmatter,
      dir: dir,
      slug: frontmatter.slug,
      target: path.join(publicDir, frontmatter.slug),
      bodyHtml: compileMarkdown(path.join(dir, "main.md"))
    };
  }));
}

/**
 * Simply filters a collection of post objects based on whether their
 * "update" property is set to true.
 * @param  {Array}  posts   A collection of unfiltered post objects.
 * @return {Q Promise}      A fulfilled promise whose value is the filtered
 *                          collection of post objects whose "updated" value 
 *                          is true.
 */
function getUpdatedPosts (posts) {
  return Q.resolve(_.filter(posts, post => post.frontmatter.update));
}

/**
 * Creates directories corresponding to a collection of updated post objects.
 * @param  {Array}  updated   A collection of updated post objects
 * @return {Q Promise}        A Q Promise which is fulfilled asynchronously
 *                            once all the new directories have been created.
 */
function updatePublicDirs (updated) {
  return Q.all(_.map(updated, post => qMkDirP(post.target)));
}

function writeUpdatedFrontmatter (updated) {
  return Q.all(_.map(updated, post => {
    var frontmatter = _.clone(post.frontmatter);

    frontmatter.update = false;

    return qFsWriteFile(
      path.join(post.dir, "frontmatter.json"),
      JSON.stringify(frontmatter, null, '\t')
    );
  }));
}

function generateUpdated () {
  return qReadDir(contentDir)
    .then(buildPostCollection)
    .tap(_.partial(qMkDirP, publicDir))
    .then(getUpdatedPosts)
    .tap(updatePublicDirs)
    .tap(writeUpdatedFrontmatter)
    .then(console.log)
    .fail(console.log);
}

module.exports = {
  generateUpdated: generateUpdated
};