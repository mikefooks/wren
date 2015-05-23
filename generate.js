"use strict";

var fs = require("fs"),
  path = require("path"),
  _ = require("lodash"),
  Q = require("q"),
  marked = require("marked"),
  ejs = require("ejs");

var contentDir = path.join(process.cwd(), "content"),
  themeDir = path.join(process.cwd(), "theme");

var readFile = _.partialRight(fs.readFileSync, "utf8"),
  parseJSON = _.flow(readFile, JSON.parse),
  compileMarkdown = _.flow(readFile, marked);

var qReadDir = Q.nfbind(fs.readdir);

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

function compileTemplate (context, template) {
  return ejs.compile(template)(context);
}

var posts = qReadDir(contentDir)
  .then(_.partialRight(_.map, retrieveContentInfo))
  .then(_.partialRight(_.map, assignHtml));

var index = posts
  .then(function (posts) {
    return {
      titles: _.pluck(posts, "frontmatter.title")
    };
  })
  .then(_.partialRight(compileTemplate, readFile(path.join(themeDir, "index.ejs"))))
  .then(function (html) {
    console.log(html);
  })
  .fail(function (err) {
    console.log(err);
  });

posts.then(function (posts) {
  console.log(posts);
});