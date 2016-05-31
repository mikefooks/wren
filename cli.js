"use strict";

let path = require("path"),
  fs = require("fs"),
  _ = require("lodash"),
  Q = require("q"),
  program = require("commander"),
  G = require("./generate.js"),
  mkdirp = require("mkdirp"),
  rimraf = require("rimraf"),
  uuid = require("node-uuid");

let CWD = process.cwd();

let qMkDirP = Q.nfbind(mkdirp),
  qRimraf = Q.nfbind(rimraf),
  qFsReadFile = Q.nfbind(fs.readFile),
  qFsWriteFile = Q.nfbind(fs.writeFile);

let config = {
  publicFolder: path.join(CWD, "public"),
  contentFolder: path.join(CWD, "content"),
  author: "Mike Fooks"
};

let contentDir = _.partial(path.join, config.contentFolder);

program
  .version("0.0.1")
  .option("delete <s>", "Deletes a post", deletePost)
  .option("generate", "Generates!", G.generateUpdated)

program
  .command("new")
  .description("Creates a new post")
  .option("-t, --title <s>", "Adds a title to the post")
  .action(options => createNewPost(options.title));

program.parse(process.argv);
/*
  UTILITIES
 */

function slugify (str) {
  return _.snakeCase(str.replace(/[^\w\s]/g, ""));
}

function nameContentFolder(frontmatter) {
  let dateString = frontmatter.created
    .substring(0, 10)
    .replace(/\-/g, "_");

  return [dateString, frontmatter.slug].join("_");
}

/*
 PROMISE-RETURNING FUNCTIONS
 */

/**
 * Is fed the title through the cli's new command and builds an object
 * which will ultimately become the new post's frontmatter.json file.
 * @param  { String } title   The String title for the new post.
 * @return { Q Promise }      A fulfilled Q promise bearing the new
 *                            frontmatter object.
 */
function createDefaultFrontMatter (title) {
  let created = new Date().toISOString(),
    id =  uuid.v4(),
    frontmatter = {
      id,
      title: title || "",
      author: config.author,
      slug: title ? slugify(title) : id,
      created,
      modified: created,
      keywords: [],
      update: true
    };

  return Q.resolve(frontmatter);
}

function createNewPost (title) {
  return createDefaultFrontMatter(title)
    .tap(console.log)
    .tap(_.flow(nameContentFolder, contentDir, qMkDirP))
    .then(frontmatter =>
      Q.all([
        qMkDirP(contentDir(nameContentFolder(frontmatter), "images")),
        qFsWriteFile(
          contentDir(nameContentFolder(frontmatter), "frontmatter.json"),
          JSON.stringify(frontmatter, null, '\t')),
        qFsWriteFile(
          contentDir(nameContentFolder(frontmatter), "main.md"),
          "<!-- Write your post here! -->")
      ])
    );
}

function deletePost (dir) {
  let contentPath = path.join(config.contentFolder, dir);

  return qFsReadFile(path.join(contentPath, "frontmatter.json"))
    .then(fm => {
      let slug = JSON.parse(fm).slug;

      return Q.all([
        qRimraf(contentPath),
        qRimraf(path.join(config.publicFolder, slug))
      ]);
    });
}
