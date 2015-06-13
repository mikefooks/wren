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

function compileTemplate (template, context) {
  return ejs.compile(template)(context);
}

function buildPostCollection (posts) {
  return Q(_.map(posts, function (post) {
    var dir = path.join(contentDir, post),
      frontmatter = parseJSON(path.join(dir, "frontmatter.json")),
      slug = slugify(frontmatter.title);

    return {
      frontmatter: frontmatter,
      dir: dir,
      slug: slug,
      target: path.join(publicDir, slug),
      url: path.join(config.rootUrl, slug),
      bodyHtml: compileMarkdown(path.join(dir, "main.md"))
    };
  }));
}

function getUpdatedPosts (posts) {
  return Q(_.filter(posts, post => post.frontmatter.update));
}

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

var posts = qReadDir(contentDir)
  .then(buildPostCollection);

posts.tap(_.partial(qMkDirP, publicDir))
  .then(getUpdatedPosts)
  .tap(updatePublicDirs)
  .tap(writeUpdatedFrontmatter)
  .then(console.log)
  .fail(console.log);