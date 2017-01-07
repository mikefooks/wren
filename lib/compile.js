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

let filters = {
  updated: posts => _.filter(posts, post => post.frontmatter.update),
  notHidden: files => _.filter(files, file => !/^\./.test(file))
};

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

/**
 * Takes the config object and uses it to build a collection of objects
 * whose only property so far is the name of each post directory.
 *
 * @param  { Object: config } The object obtained from parsing the
 *                            config file.
 * @return { Q Promise } A Q promise which when fulfilled returns a 
 *                       site object, containing the config object and
 *                       an array of soon-to-be post objects.
 */
function __initializePostCollection (config) {
  return qfs.list(config.contentDir)
    .then(filters.notHidden)
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
 * the .source property) and assigns to each object its corresponding
 * frontmatter, parsed from the frontmatter.json file.
 *
 * @param  { Object: site } An object containing the config object, and an
 *                          array of incipient post objects.
 *                          
 * @return { Q Promise } A Q Promise for a site object with a collection of
 *                       posts objects with parsed frontmatter assigned.
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
 * @param   { Object: site } A site object.
 * @returns { Q Promise } A Q promise for a site object with an
 *                        updated posts array.
 */
function __updateSlugs (site) {
  return Q.resolve(_.map(site.posts, post => {
    post.frontmatter.slug = U.slugify(post.frontmatter.title);
    return post;
  }))
  .then(posts => _.assign(site, { posts }));
}

/**
 * updates the posts array with each post's respective target directory
 * in the public folder.
 *
 * @param  { Object: site } A site object
 * @return { Q Promise } A Q Promise for a site object with post array
 *                       updated with target directories.
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
 * Renders HTML from each post's markdown file and assigns it to each
 * post object.
 *
 * @param { Object: site } A site object.
 * @returns { Q Promise } A Q Promise with the posts collection updated
 *                        with rendered HTML from each post's markdown
 *                        file.
 */
function __assignBodyHtml (site) {
  return Q.all(_.map(site.posts, post =>
    qfs.read(path.join(post.source, "main.md"))
      .then(_.partialRight(marked, { renderer: renderer }))
      .then(html => _.assign(post, { bodyHtml: html }))
  ))
  .then(posts => _.assign(site, { posts }));
}

/**
 * Takes a collection of post objects and returns a two-dimensional array
 * containing the names of all the images found in each post's image
 * directory.
 *
 * @param  { Object: site } A collection of post objects whose images we
 *                          would like to know.
 * @return { Q Promise } returns a Q Promise that's resolved when the
 *                       contents of the image directories have been
 *                       successfully read.
 */
function __assignImages (site) {
  return Q.all(_.map(site.posts, post =>
    qfs.list(path.join(post.dir, "images"))
      .then(images => _.assign(post, { images }))
  ))
  .then(posts => _.assign(site, { posts }));
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
