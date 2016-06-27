"use strict";

let Q = require("q"),
  _ = require("lodash"),
  path = require("path"),
  marked = require("marked"),
  renderer = require("./renderer.js"),
  config = require("../config.js"),
  qfs = require("q-io/fs"),
  U = require("./utilities.js");

marked.setOptions({
  breaks: false,
  gfm: true,
  smartypants: true
});

/**
 * POST COMPILATION FUNCTIONS
 */

/**
 * Builds a collection of objects representing all the posts to be updated,
 * and all the necessary properties required to generate the html files
 * and directories for said posts.
 *
 * @param  { Array } posts  An array of directory names (strings) from the
 *                        content folder
 * @return { Q Promise }    A fulfilled promise whose value is a collection of
 *                        post objects.
 */
function compilePostCollection (config) {
  return __initializePostCollection(config)
    .then(__assignFrontmatter)
    .then(__updateSlugs)
    .then(__assignTargetDir)
    .then(__assignBodyHtml);
    // .then(__assignImages);
}

function __initializePostCollection (config) {
  return qfs.list(config.contentDir)
    .then(function (dirs) {
        return {
          config,
          posts: _.map(dirs, dir => {
            let source = path.join(config.contentDir, dir);
            return { source };
          })
        };
    }) 
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
function __assignFrontmatter (site) {
  return Q.all(_.map(site.posts, function (post) {
    return qfs.read(path.join(post.source, "frontmatter.json"))
      .then(function (fm) {
        let frontmatter = JSON.parse(fm);

        frontmatter.created = new Date(frontmatter.created);
        frontmatter.modified = new Date();

        return _.assign(post, { frontmatter });
      });
  }))
  .then(posts => _.assign(site, { posts }));
}

/**
 * Takes a collection of posts and, if the title of any of the posts has
 * been changed, updates that post's slug property.
 *
 * @param   { Array }     posts A collection of post objects.
 * @returns { Q Promise }       An updated collection of post objects.
 */
function __updateSlugs (site) {
  return Q.resolve(_.map(site.posts, post => {
    post.frontmatter.slug = U.slugify(post.frontmatter.title);
    return post;
  }))
  .then(posts => _.assign(site, { posts }));
}

/**
 * [assignTargetDir description]
 * @param  {[type]} posts [description]
 * @return {[type]}       [description]
 */
function __assignTargetDir (site) {
  return Q.resolve(_.map(site.posts, post => {
    return _.assign(post, 
      { target: path.join(site.config.publicDir, post.frontmatter.slug)}
    );
  }))
  .then(posts => _.assign(site, { posts }));
}

/**
 * 
 *
 * @param { Array } posts
 * @returns { Q Promise }
 */
function __assignBodyHtml (posts) {
  return Q.all(_.map(posts, post =>
    qfs.read(path.join(post.dir, "main.md"))
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
function __assignImages (posts) {
  return Q.all(_.map(posts, post =>
    qfs.list(path.join(post.dir, "images"))
      .then(images => _.assign(post, { images: images }))
  ));
}

module.exports = {
  compilePostCollection,
  __updateSlugs,
  __initializePostCollection,
  __assignFrontmatter,
  __assignTargetDir,
  __assignBodyHtml,
  __assignImages
};
