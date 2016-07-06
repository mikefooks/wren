"use strict";

let path = require("path"),
  _ = require("lodash"),
  Q = require("q"),
  gm = require("gm"),
  ejs = require("ejs"),
  config = require("../config.js"),
  U = require("./utilities.js"),
  qfs = require("q-io/fs"),
  compilePostCollection = require("./compile.js").compilePostCollection;;

let filters = {
  updated: posts => _.filter(posts, post => post.frontmatter.update),
  notHidden: files => _.filter(files, file => !/^\./.test(file))
};

let imageRe = /(\.jpg|\.JPG|\.gif|\.GIF|\.png|\.PNG)$/;

Q.longStackSupport = true;

/**
 * Creates directories corresponding to a collection of updated post objects.
 * @param  { Array }  updated   A collection of updated post objects
 * @return { Q Promise }        A Q Promise which is fulfilled asynchronously
 *                            once all the new directories have been created.
 */
function __updatePublicDirs (site) {
  return Q.all(_.map(site.posts, post => qfs.makeTree(post.target)))
    .then(() => site);
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
    let frontmatter = _.clone(post.frontmatter);

    frontmatter.update = false;

    return qfs.write(
      path.join(post.dir, "frontmatter.json"),
      JSON.stringify(frontmatter, null, '\t')
    );
  }));
}

/**
 * Takes a collection of (updated) post objects and generates the main index
 * page to the root of the public folder, based upon the index.ejs template
 * in the theme directory.
 * @param  { Array } posts    A collection of post objects.
 * @return { Q Promise }      A Q promise fulfilled when the HTML index has
 *                            been written to the public directory.
 */
function __generateIndex (site) {
  return qfs.read(path.join(site.config.themeDir, "index.ejs"))
    .tap(template =>
      qfs.write(
        path.join(site.config.publicDir, "index.html"),
        ejs.compile(template)({ posts: site.posts, config: site.config })
    ))
    .then(() => site);
}

function __generatePosts (site) {
  return qfs.read(path.join(site.config.themeDir, "post.ejs"))
    .tap(template =>
      Q.all(_.map(site.posts, post =>
        qfs.write(
          path.join(post.target, "index.html"),
          ejs.compile(template)({ post: post, config: config })
        )
    )))
    .then(() => site);;
}

/**
 * Takes a single image and, using the config object specification, creates new
 * responsive images and puts them in the public asset folder for the post. NB:
 * For each original image, the responsive images are generated in parallel.
 * @param  { String } path      The full file name of the original image to be
 *                              converted.
 * @param  { String } target    The public directory to which the converted
 *                              responsive images will be written.
 * @return { Q Promise }        Returns a Q promised that's resolved when the
 *                              responsive images has been written successfully.
 */

function generateImage (image, target) {
  let imageName = path.basename(image);

  return Q.all(_.map(config.responsiveImages, (props) =>
    Q.promise((resolve, reject) => {
      let targetName = path.join(target, imageName.replace(imageRe, "_" + props.size + "$1"));

      gm(image)
        .autoOrient()
        .channel("red")
        .resize(props.width)
        .write(targetName, function (err) {
          if (err) {
            return reject(err);
          } else {
            return resolve();
          }
        });
    })
  ));
}

function __copyAssets (site) {
    let re = /.css|.js$/;

    return qfs.list(site.config.themeDir)
      .then(_.partialRight(_.filter, file => re.test(file)))
      .then(function (files) {
        return Q.all(_.map(files, function (file) {
          return qfs.copy(path.join(site.config.themeDir, file),
            path.join(site.config.publicDir, file));
        }));
      })
      .then(() => site);
  }


function generatePostImages (posts) {
  return Q.all(_.map(posts,
    post => {
      let factories = _.map(post.images,
        image => _.partial(generateImage,
          path.join(post.source, "images", image),
          path.join(post.target, "images")));

      return _.reduce(factories,
        (current, pending) => current.then(pending),
        qfs.makeTree(path.join(post.target, "images")));
  }));
}

/*
  GENERATOR FUNCTIONS
 */

function generateAll () {
  return compilePostCollection(config)
    .tap(() => qfs.removeTree(config.publicDir))
    .tap(() => qfs.makeTree(config.publicDir))
    .tap(updatePublicDirs)
    .tap(generateIndex)
    .tap(generatePosts)
    // .tap(generatePostImages)
    .tap(copyAssets)
    .tap(writeUpdatedFrontmatter)
    .fail(console.log);
}

module.exports = {
  __updatePublicDirs,
  __generateIndex,
  __generatePosts,
  __copyAssets,
  generateAll
};
