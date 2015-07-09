"use strict";

var fs = require("fs"),
  path = require("path"),
  url = require("url"),
  _ = require("lodash"),
  H = require("./helpers.js"),
  Q = require("q"),
  gm = require("gm"),
  marked = require("marked"),
  ejs = require("ejs"),
  rimraf = require("rimraf"),
  mkdirp = require("mkdirp");

var config = {
  rootUrl: "http://localhost/"
};

var CWD = process.cwd(),
  contentDir = path.join(CWD, "content"),
  publicDir = path.join(CWD, "public"),
  themeDir = path.join(CWD, "theme");

var readFile = _.partialRight(fs.readFileSync, "utf8"),
  parseJSON = _.flow(readFile, JSON.parse),
  compileMarkdown = _.flow(readFile, marked);

var qReadDir = Q.nfbind(fs.readdir),
  qReadFile = Q.nfbind(fs.readFile),
  qMkDir = Q.nfbind(fs.mkdir),
  qFsExists = Q.nfbind(fs.exists),
  qMkDirP = Q.nfbind(mkdirp),
  qFsWriteFile = Q.nfbind(fs.writeFile);

var filters = {
  updated: posts => _.filter(posts, post => post.frontmatter.update)
};

marked.setOptions({
  breaks: false,
  gfm: true,
  smartypants: true
});

/*
  UTILITIES
 */

/*
 * Not unlike a tap method, this executes a promise-returning function
 * but then returns a promise that resolves the arguments
 * passed to the original function.
 */
function sideEffect (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments, 0);

    return fn.apply(this, args).then(() => args);
  };
}

/**
 * Makes a string HTML tag.
 * @param  {[type]} type  [description]
 * @param  {[type]} attrs [description]
 * @return {[type]}       [description]
 */
function htmlTag (type, attrs) {
  var tag = "<" + type;

  _.forIn(attrs, (val, key) => {
    return tag += " " + key + "='" + val + "'";
  });

  return tag += "/>";
}


/*
  PROMISE-RETURNING FUNCTIONS
 */

/**
 * Builds a collection of objects representing all the posts to be updated,
 * and all the necessary properties required to generate the html files 
 * and directories for said posts.
 * @param  {Array} posts  An array of directory names (strings) from the 
 *                        content folder
 * @return {Q Promise}    A fulfilled promise whose value is a collection of 
 *                        post objects.
 */
function buildPostCollection (posts) {
  return Q.resolve(_.map(posts, post => {
    var dir = path.join(contentDir, post);

    return {
      dir: dir,
      bodyHtml: compileMarkdown(path.join(dir, "main.md"))
    };
  }));
}

function assignFrontmatter (posts) {
  return Q.all(_.map(posts, post => { 
    return qReadFile(path.join(post.dir, "frontmatter.json"))
      .then(fm => {
        var frontmatter = JSON.parse(fm);
        
        frontmatter.created = new Date(frontmatter.created);
        frontmatter.modified = new Date();

        return _.assign(post, frontmatter);
      });
  }));
}

/**
 * Takes a collection of post objects and returns a two-dimensional array
 * containing the names of all the images found in each post's image 
 * directory.
 * @param  { Array } updated   A collection of post objects whose images we 
 *                             would like to know.   
 * @return { Q Promise }       returns a Q Promise that's resolved when the
 *                             contents of the image directories have been 
 *                             successfully read.           
 */
function getImageFileNames (updated) {
  return Q.all(_.map(updated, post => { 
    return qReadDir(path.join(post.dir, "images"))
      .then(images => _.assign(post, { images: images }));
  }));
}

/**
 * Creates directories corresponding to a collection of updated post objects.
 * @param  { Array }  updated   A collection of updated post objects
 * @return { Q Promise }        A Q Promise which is fulfilled asynchronously
 *                            once all the new directories have been created.
 */
function updatePublicDirs (updated) {
  return Q.all(_.map(updated, post => qMkDirP(post.target)));
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
    var frontmatter = _.clone(post.frontmatter);

    frontmatter.update = false;

    return qFsWriteFile(
      path.join(post.dir, "frontmatter.json"),
      JSON.stringify(frontmatter, null, '\t')
    );
  }));
}

/**
 * Takes a collection of (updated) post objects and generates the main index 
 * page to the root of the public folder, based upon the index.ejs template
 * in the theme directory.
 * @param  { Array } updated  A collection of post objects, (presumably, though
 *                            not necessarily) with their update attribute set 
 *                            to true.
 * @return { Q Promise }      A Q promise fulfilled when the HTML index has 
 *                            been written to the public directory.
 */
function generateIndex (updated) {
  var template = readFile(path.join(themeDir, "index.ejs"));

  return qFsWriteFile(
    path.join(publicDir, "index.html"),
    ejs.compile(template)({ posts: updated })
  );
}

/**
 * Resizes and possibly extracts a colour channel from an image in order to
 * bounce it to black and white.
 * @param  { String } size      The width in pixel of the output image---the image
 *                              will retain its original aspect ratio.
 * @param  { String } path      The path of the original image to be resized etc.
 * @param  { String } target    The destination path of the converted image.
 * @return { Q Promise }        Returns a Q promised that's resolved when the
 *                              image has been written successfully. 
 */
function convertImage (size, path, target) {
  return Q.promise(function (resolve, reject) {
    gm(path)
      .autoOrient()
      .resize(size)
      .write(target, function (err) {
        if (err) { 
          return reject(err);
        } else {
          return resolve();
        }
      });
  });
}

function writeResponsiveImages (images) {
  return Q.all(_.map(images, image => {

  }));
}


/*
  GENERATE FUNCTIONS
 */

function generateUpdated () {
  return qReadDir(contentDir)
    .then(function (posts) {
      return buildPostCollection(posts)
        .then(assignFrontmatter)
        .then(getImageFileNames);
    })
    // .tap(_.partial(qMkDirP, publicDir))
    // .tap(_.flow(filters.updated, updatePublicDirs))
    // .tap(_.flow(filters.updated, generateIndex))
    // .tap(_.flow(filters.updated, writeUpdatedFrontmatter))
    // .then(_.flow(filters.updated, getImageFileNames))
    .then(console.log)
    .fail(console.log);
}

module.exports = {
  generateUpdated: generateUpdated
};