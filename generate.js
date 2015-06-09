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
  qMkDirP = Q.nfbind(mkdirp),
  qFsWriteFile = Q.nfbind(fs.writeFile);

marked.setOptions({
  breaks: false,
  gfm: true,
  smartypants: true
});

function compileTemplate (context, template) {
  return ejs.compile(template)(context);
}

// Create necessary post folders in the public directory.
function getUpdatedPosts (contDir, pubDir) {
  return Q.all([qReadDir(contDir), qReadDir(pubDir)])
    .spread(_.difference);
}

function writeUpdatedFrontmatter (posts) {
  return Q.all(_.map(posts, function (post) {
    var newFm = _.clone(post.frontmatter);
    newFm.update = false;

    return qFsWriteFile(path.join(post.dir, "frontmatter.json"), JSON.stringify(newFm, null, '\t'));     
  }));
}

function switchUpdateProperty (posts) {
  return Q(posts)
    .then(_.partialRight(_.filter, (post) => post.frontmatter.update))
    .then(writeUpdatedFrontmatter)
    .done();
}

function getPosts (contDir) {
  return qReadDir(contDir)
    .then(function (posts) {
      return _.map(posts, function (post) {
        var dir = path.join(contentDir, post),
          frontmatter = parseJSON(path.join(dir, "frontmatter.json")),
          slug = _.snakeCase(frontmatter.title),
          url = path.join(config.rootUrl, slug),
          bodyHtml = compileMarkdown(path.join(dir, "main.md"));

        return {
          frontmatter: frontmatter,
          dir: dir,
          slug: slug,
          url: url,
          bodyHtml: bodyHtml
        };
      });
    });
}

function updatePublicDirs (updated, pubDir) {
  return Q(updated)
    .then(_.partialRight(_.map, _.ary(_.partial(path.join, pubDir), 1)))
    .then(_.partialRight(_.each, mkdirp.sync));
}

// Get the names of all post directories in the content folder
var updated = qReadDir(contentDir),
  old = qReadDir(publicDir);

// Build a collection of post data, frontmatter, etc.
// var postAttrs = posts
//   .then(_.partialRight(_.map, retrieveContentInfo))
//   .then(_.partialRight(_.map, assignSlug))

// qMkDirP(publicDir)
//   .then(_.partial(getUpdatedPosts, contentDir, publicDir))
//   .then(_.partialRight(updatePublicDirs, publicDir))
//   .then(console.log)
//   .fail(console.log);

getPosts(contentDir)
  .then(switchUpdateProperty)
  .then(console.log)
  .fail(console.log);