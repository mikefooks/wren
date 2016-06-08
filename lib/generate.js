"use strict";

let path = require("path"),
  _ = require("lodash"),
  Q = require("q"),
  gm = require("gm"),
  ejs = require("ejs"),
  config = require("./config.js"),
  U = require("./utilities.js"),
  qFn = require("./promisified_fns.js"),
  compilePostCollection = require("./compile.js");

let filters = {
  updated: posts => _.filter(posts, post => post.frontmatter.update),
  notHidden: files => _.filter(files, file => !/^\./.test(file))
};

let imageRe = /(\.jpg|\.JPG|\.gif|\.GIF|\.png|\.PNG)$/;

/**
 * Creates directories corresponding to a collection of updated post objects.
 * @param  { Array }  updated   A collection of updated post objects
 * @return { Q Promise }        A Q Promise which is fulfilled asynchronously
 *                            once all the new directories have been created.
 */
function updatePublicDirs (updated) {
  return Q.all(_.map(updated, post => qFn.mkDirP(post.target)));
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

    return qFn.fsWriteFile(
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
function generateIndex (posts) {
  qFn.fsReadFile(path.join(config.themeDir, "index.ejs"), "utf8")
    .then(template =>
      qFn.fsWriteFile(
        path.join(config.publicDir, "index.html"),
        ejs.compile(template)({ posts: posts, config: config })
    ));
}

function generatePosts (posts) {
  qFn.fsReadFile(path.join(config.themeDir, "post.ejs"), "utf8")
    .then(template =>
      Q.all(_.map(posts, post =>
        qFn.fsWriteFile(
          path.join(post.target, "index.html"),
          ejs.compile(template)({ post: post, config: config })
        )
    )));
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

function generatePostImages (posts) {
  return Q.all(_.map(posts,
    post => {
      let factories = _.map(post.images,
        image => _.partial(generateImage,
          path.join(post.dir, "images", image),
          path.join(post.target, "images")));

      return _.reduce(factories,
        (current, pending) => current.then(pending),
        qFn.mkDirP(path.join(post.target, "images")));
  }));
}

/*
  GENERATOR FUNCTIONS
 */

function generateUpdated () {
  return qFn.fsReadDir(config.contentDir)
    .then(compilePostCollection)
    .tap(_.flow(filters.updated, generatePosts))
    .tap(_.flow(filters.updated, generatePostImages))
    .tap(_.flow(filters.updated, writeUpdatedFrontmatter))
    .then(console.log)
    .fail(console.log);
}

function generateAll () {
  return qFn.fsReadDir(config.contentDir)
    .then(_.flow(filters.notHidden, compilePostCollection))
    .tap(_.partial(qFn.rimraf, config.publicDir))
    .tap(_.partial(qFn.mkDirP, config.publicDir))
    .tap(updatePublicDirs)
    .tap(generateIndex)
    .tap(generatePosts)
    .tap(generatePostImages)
    .tap(function (posts) {
      let re = /.css$/;
 
      return qFn.fsReadDir(config.themeDir)
        .then(_.partialRight(_.filter, file => re.test(file)))
        .then(function (files) {
          return Q.all(_.map(files, function (file) {
            return U.copyFile(path.join(config.themeDir, file), path.join(config.publicDir, file));
          }));
        });
    })
    .tap(writeUpdatedFrontmatter)
    // .then(console.log)
    .fail(console.log);
}

module.exports = {
  generateUpdated,
  generateAll
};
