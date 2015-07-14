"use strict";

var fs = require("fs"),
  path = require("path"),
  url = require("url"),
  _ = require("lodash"),
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

var config = {
  responsiveImages: [
    { size: "small", breakpoint: 0, width: 400 },
    { size: "medium", breakpoint: 480, width: 600 },
    { size: "large", breakpoint: 768, width: 1000 }
  ]
};

var imageRe = /(\.jpg|\.JPG|\.gif|\.GIF|\.png|\.PNG)$/;

var renderer = new marked.Renderer();

/**
 * This mess is the img rendering function for marked; it replaces the
 * regular image rendering witha picture element and all the 
 * source elements that it contains, based on the responsive image
 * settings enumerated in the config file.
 */
renderer.image = function (href, title, text) {
  var src = _.sortBy(config.responsiveImages, "breakpoint"),
    img = src.splice(0, 1),
    tags = _.map(src.reverse(), (props) =>
      "<source srcset='" + 
      path.join("images", href.replace(imageRe, "_" + props.size + "$1")) + 
      "' media='(min-width: " + props.breakpoint + "px)'>");

  tags.push("<img srcset='" +
    path.join("images", href.replace(imageRe, "_" + img[0].size + "$1")) +
    "' alt='" + text + "'/>\n"
  );

  return "<picture>\n" + tags.join("\n") + "</picture>\n";
}

marked.setOptions({
  breaks: false,
  gfm: true,
  smartypants: true
});

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
function buildPostCollection (dirs) {
  return Q.resolve(_.map(dirs, dir => ({ dir: path.join(contentDir, dir) })))
    .then(assignFrontmatter)
    .then(assignTargetDir)
    .then(assignBodyHtml)
    .then(assignImages);
}

/**
 * Takes the collection of incipient post objects (just object containing
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
    qReadFile(path.join(post.dir, "frontmatter.json"), "utf8")
      .then(fm => {
        var frontmatter = JSON.parse(fm);
        
        frontmatter.created = new Date(frontmatter.created);
        frontmatter.modified = new Date();

        return _.assign(post, { frontmatter: frontmatter });
      })
  ));
}

/**
 * [assignTargetDir description]
 * @param  {[type]} posts [description]
 * @return {[type]}       [description]
 */
function assignTargetDir (posts) {
  return Q.resolve(_.map(posts, post =>
    _.assign(post, { target: path.join(publicDir, post.frontmatter.slug) })
  ));
}

function assignBodyHtml (posts) {
  return Q.all(_.map(posts, post =>
    qReadFile(path.join(post.dir, "main.md"), "utf8")
      .then(_.partialRight(marked, { renderer: renderer }))
      .then(html => _.assign(post, { bodyHtml: html }))
  ));
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
function assignImages (posts) {
  return Q.all(_.map(posts, post =>
    qReadDir(path.join(post.dir, "images"))
      .then(images => _.assign(post, { images: images }))
  ));
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
 * @param  { Array } posts    A collection of post objects.
 * @return { Q Promise }      A Q promise fulfilled when the HTML index has 
 *                            been written to the public directory.
 */
function generateIndex (posts) {
  qReadFile(path.join(themeDir, "index.ejs"), "utf8")
    .then(template => 
      qFsWriteFile(
        path.join(publicDir, "index.html"),
        ejs.compile(template)({ posts: posts })
    ));
}

function generatePosts (posts) {
  qReadFile(path.join(themeDir, "post.ejs"), "utf8")
    .then(template =>
      Q.all(_.map(posts, post =>
        qFsWriteFile(
          path.join(post.target, "index.html"),
          ejs.compile(template)({ post: post })
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
  var imageName = path.basename(image);

  return Q.all(_.map(config.responsiveImages, (props) => 
    Q.promise((resolve, reject) => {
      var targetName = path.join(target, imageName.replace(imageRe, "_" + props.size + "$1"));

      gm(image)
        .autoOrient()
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
      var factories = _.map(post.images,
        image => _.partial(generateImage,
          path.join(post.dir, "images", image),
          path.join(post.target, "images")));

      return _.reduce(factories, 
        (current, pending) => current.then(pending),
        qMkDirP(path.join(post.target, "images")));
  }));
}

/*
  GENERATE FUNCTIONS
 */

function generateUpdated () {
  return qReadDir(contentDir)
    .then(buildPostCollection)
    .tap(_.partial(qMkDirP, publicDir))
    .tap(_.flow(filters.updated, updatePublicDirs))
    .tap(_.flow(filters.updated, generateIndex))
    .tap(_.flow(filters.updated, generatePosts))
    .tap(console.log)
    // .tap(_.flow(filters.updated, generatePostImages))
    // .tap(_.flow(filters.updated, writeUpdatedFrontmatter))
    // .then(console.log)
    .fail(console.log);
}

module.exports = {
  generateUpdated: generateUpdated
};