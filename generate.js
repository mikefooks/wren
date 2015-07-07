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

var readFile = _.partialRight(fs.readFileSync, "utf8"),
  parseJSON = _.flow(readFile, JSON.parse),
  compileMarkdown = _.flow(readFile, marked);

var qReadDir = Q.nfbind(fs.readdir),
  qMkDir = Q.nfbind(fs.mkdir),
  qFsExists = Q.nfbind(fs.exists),
  qMkDirP = Q.nfbind(mkdirp),
  qFsWriteFile = Q.nfbind(fs.writeFile);

var filters = {
  updated: posts => _.filter(posts, post => post.frontmatter.update)
};

marked.setOptions({
  breaks: false,
  gfm: true,
  smartypants: true
});

/*
 * A decorator that returns, rather than just the return value, an array
 * containing the return value and an array containing the original
 * arguments to the function. 
 */
function passThrough (fn, ctx) {
  return function () {
    var args = Array.prototype.slice.call(arguments, 0),
      ctx = ctx || this;

    return [fn.apply(ctx, args), args];
  };
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
 * Creates directories corresponding to a collection of updated post objects.
 * @param  { Array }  updated   A collection of updated post objects
 * @return { Q Promise }        A Q Promise which is fulfilled asynchronously
 *                            once all the new directories have been created.
 */
function updatePublicDirs (updated) {
  return Q.all(_.map(updated, post => qMkDirP(post.target)));
}

/**
 * Takes a collection of updated post objects and rewrites their
 * frontmatter.json files to reflect an updated property of false.
 * @param  { Array }  updated   A collection of post objects whose updated
 *                              properties are (presumably), set to true.
 * @return { Q Promise }        A Q.all promise that resolves once all the new
 *                             frontmatter.json files have been written.
 */
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

/**
 * Takes a collection of (updated) post objects and generates the main index 
 * page to the root of the public folder, based upon the index.ejs template
 * in the theme directory.
 * @param  { Array } updated  A collection of updated post objects.
 * @return { Q Promise }      A Q promise fulfilled when the HTML index has 
 *                            been written to the public directory.
 */
function generateIndex (updated) {
  var template = readFile(path.join(themeDir, "index.ejs"));

  return qFsWriteFile(
    path.join(publicDir, "index.html"),
    ejs.compile(template)({ posts: updated })
  );
}

function generateUpdated () {
  return qReadDir(contentDir)
    .then(buildPostCollection)
    .tap(_.partial(qMkDirP, publicDir))
    .tap(_.flow(filters.updated, updatePublicDirs))
    .tap(_.flow(filters.updated, generateIndex))
    .tap(_.flow(filters.updated, writeUpdatedFrontmatter))
    .fail(console.log);
}

module.exports = {
  generateUpdated: generateUpdated
};