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

var cwd = process.cwd(), 
  contentDir = path.join(cwd, "content"),
  publicDir = path.join(cwd, "public"),
  themeDir = path.join(cwd, "theme");

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

var argLog = function argLog (fn) {
  return _.restParam(function (args) {
    console.log(args);
    fn.apply(this, args);
  });
};

function compileTemplate (context, template) {
  return ejs.compile(template)(context);
}

function writeUpdatedFrontmatter (posts) {
  return Q(posts)
    .then(_.partialRight(_.map, function (post) {
      var newFm = _.clone(post.frontmatter),
        pth, jsn;

        newFm.update = false;

      pth = path.join(post.dir, "frontmatter.json");
      jsn = JSON.stringify(newFm, null, '\t');

      return [ pth, jsn ];
    }))
    .then(_.partialRight(_.each, (data) => fs.writeFileSync.apply(this, data)));
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

function getUpdatedPosts (posts) {
  return Q(posts)
    .then(_.partialRight(_.filter, (post) => post.frontmatter.update));
}

function updatePublicDirs (updated) {
  return Q(updated)
    .then(_.partialRight(_.pluck, "slug"))
    .then(_.partialRight(_.map, _.ary(_.partial(path.join, publicDir), 1)))
    .then(_.partialRight(_.each, mkdirp.sync));
}

var posts = getPosts(contentDir);

posts.tap(_.partial(qMkDirP, publicDir))
  .tap(_.flow(getUpdatedPosts, updatePublicDirs))
  .tap(_.flow(getUpdatedPosts, writeUpdatedFrontmatter))
  .fail(console.log);