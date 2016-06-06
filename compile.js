"use strict";

let Q = require("q"),
  _ = require("lodash"),
  path = require("path"),
  qFn = require("./promisified_fns.js");

/**
 * POST COMPILATION FUNCTIONS
 */

/**
 * Builds a collection of objects representing all the posts to be updated,
 * and all the necessary properties required to generate the html files
 * and directories for said posts.
 *
 * @param  {Array} posts  An array of directory names (strings) from the
 *                        content folder
 * @return {Q Promise}    A fulfilled promise whose value is a collection of
 *                        post objects.
 */
function compilePostCollection (dirs) {
  return Q.resolve(_.map(dirs, dir => ({ dir: path.join(contentDir, dir) })))
    .then(assignFrontmatter)
    .then(updateSlugs)
    .then(assignTargetDir)
    .then(assignBodyHtml)
    .then(assignImages);
}

/**
 * Takes the collection of incipient post objects (just objects containing
 * the .dir property) and assigns to each object its corresponding
 * frontmatter, parsed from the frontmatter.json file.
 * @param  { Array } posts    A collection of objects each containing a
 *                            .dir property.
 * @return { Q Promise }      A promise that resolves when all frontmatter.json
 *                            files have been read, parsed, and their contents
 *                            assigned to the appropriate post object.
 */
function assignFrontmatter (posts) {
  return Q.all(_.map(posts, post =>
    qFn.fsReadFile(path.join(post.dir, "frontmatter.json"), "utf8")
      .then(fm => {
        let frontmatter = JSON.parse(fm);

        frontmatter.created = new Date(frontmatter.created);
        frontmatter.modified = new Date();

        return _.assign(post, { frontmatter: frontmatter });
      })
  ));
}

function updateSlugs (posts) {
  return Q.resolve(_.map(posts, post => {
    post.frontmatter.slug = slufiy(post.title);
    return post;
  }));
}

/**
 * [assignTargetDir description]
 * @param  {[type]} posts [description]
 * @return {[type]}       [description]
 */
function assignTargetDir (posts) {
  return Q.resolve(_.map(posts, post => {
    _.assign(post, { target: path.join(publicDir, post.frontmatter.slug) })
  ));
}

/**
 * 
 *
 * @param { Array } posts
 * @returns { Q Promise }
 */
function assignBodyHtml (posts) {
  return Q.all(_.map(posts, post =>
    qFn.fsReadFile(path.join(post.dir, "main.md"), "utf8")
      .then(_.partialRight(marked, { renderer: renderer }))
      .then(html => _.assign(post, { bodyHtml: html }))
  ));
}

/**
 * Takes a collection of post objects and returns a two-dimensional array
 * containing the names of all the images found in each post's image
 * directory.
 * @param  { Array } posts     A collection of post objects whose images we
 *                             would like to know.
 * @return { Q Promise }       returns a Q Promise that's resolved when the
 *                             contents of the image directories have been
 *                             successfully read.
 */
function assignImages (posts) {
  return Q.all(_.map(posts, post =>
    qFn.fsReadDir(path.join(post.dir, "images"))
      .then(images => _.assign(post, { images: images }))
  ));
}

module.exports = compilePostCollection;
