"use strict";

var fs = require("fs"),
  path = require("path"),
  _ = require("lodash"),
  Q = require("q"),
  marked = require("marked"),
  ejs = require("ejs"),
  rimraf = require("rimraf"),
  mkdirp = require("mkdirp");

var config = {
  rootUrl: "http://localhost"
};

var contentDir = path.join(process.cwd(), "content"),
  publicDir = path.join(process.cwd(), "public"),
  themeDir = path.join(process.cwd(), "theme");

var readFile = _.partialRight(fs.readFileSync, "utf8"),
  parseJSON = _.flow(readFile, JSON.parse),
  compileMarkdown = _.flow(readFile, marked);

var qReadDir = Q.nfbind(fs.readdir),
  qMkDir = Q.nfbind(fs.mkdir),
  qFsExists = Q.nfbind(fs.exists),
  qMkDirP = Q.nfbind(mkdirp);

marked.setOptions({
  breaks: false,
  gfm: true,
  smartypants: true
});

/**
 * Takes the path of an individual article/post directory as its argument,
 * and returns a promise that resolves a collection of objects 
 * representing the metadata/info for each article/post/what-have-you.
 * @param  {String} dir       the name of an article directory containing 
 *                            a frontmatter.json file. 
 * @return {Object}           A article/post/etc. object.
 */
function retrieveContentInfo (dir) {
  return {
    dir: path.join(contentDir, dir),
    frontmatter: parseJSON(path.join(contentDir, dir, "frontmatter.json"))
  };
}

/**
 * Takes a post object, reads the main.md file from its associated
 * post/article directory, compiles the markdown in said file into 
 * HTML and assigns that HTML to the bodyHtml attribute on the
 * post object.
 * @param  {Object} post      a post/article object
 * @return {Object}           a modified post/article object      
 */
function assignHtml (post) {
  return _.assign(post, {
    bodyHtml: compileMarkdown(path.join(post.dir, "main.md"))
  });
}

function assignSlug (post) {
  return _.assign(post, {
    slug: _.snakeCase(post.frontmatter.title)
  });
}

function assignUrl (post) {
  return _.assign(post, {
    url: path.join(config.rootUrl, post.slug)
  }); 
}

function compileTemplate (context, template) {
  return ejs.compile(template)(context);
}

// Create necessary post folders in the public directory.
function updatePublicDirStructure (posts, publicDir) {
  return Q.all([posts, qReadDir(publicDir)])
    .spread(_.difference)
    .then(_.partialRight(_.map, _.ary(_.partial(path.join, publicDir), 1)))
    .then(_.partialRight(_.each, mkdirp.sync));
}

// Get the names of all post directories in the content folder
var posts = qReadDir(contentDir);

// Build a collection of post data, frontmatter, etc.
var postAttrs = posts
  .then(_.partialRight(_.map, retrieveContentInfo))
  .then(_.partialRight(_.map, assignSlug))

qFsExists(publicDir)
  .then(function (exists) {
    if (!exists) {
      return mkdirp.sync(publicDir);
    }
  })
  .then(_.partial(updatePublicDir, posts, publicDir))
  .fail(console.log);



// var index = posts
//   .then(function (posts) {
//     return {
//       titles: _.pluck(posts, "frontmatter.title")
//     };
//   })
//   .then(function (posts) {
//     console.log(posts);
//   });
// posts.then(function (posts) {
//   console.log(posts);
// });