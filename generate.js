"use strict";

var fs = require("fs"),
  path = require("path"),
  url = require("url"),
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

function slugify (str) {
  return _.snakeCase(str.replace(/[^\w\s]/g, ""));
}

function compileTemplate (context, template) {
  return ejs.compile(template)(context);
}

function writeUpdatedFrontmatter (updated) {
  return Q(updated)
    .then(_.partialRight(_.each, (post) => {
      var data = [], 
        frontmatter = _.clone(post.frontmatter);

      frontmatter.update = false;

      data.push(path.join(post.dir, "frontmatter.json"));
      data.push(JSON.stringify(frontmatter, null, '\t'));

      fs.writeFileSync.apply(this, data);
    }));
}

function getPosts (contDir) {
  return qReadDir(contDir)
    .then(function (posts) {
      return _.map(posts, function (post) {
        var dir = path.join(contentDir, post),
          frontmatter = parseJSON(path.join(dir, "frontmatter.json")),
          slug = slugify(frontmatter.title),
          target = path.join(publicDir, slug),
          url = path.join(config.rootUrl, slug),
          bodyHtml = compileMarkdown(path.join(dir, "main.md"));

        return {
          frontmatter: frontmatter,
          dir: dir,
          slug: slug,
          target: target,
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
    .then(_.partialRight(_.each, post => {
      mkdirp.sync(path.join(publicDir, post.slug));
    }));
}

var posts = getPosts(contentDir);

posts.tap(_.partial(qMkDirP, publicDir))
  .tap(_.flow(getUpdatedPosts, updatePublicDirs))
  .tap(_.flow(getUpdatedPosts, writeUpdatedFrontmatter))
  .fail(console.log);