"use strict";

let path = require("path"),
  fs = require("fs"),
  _ = require("lodash"),
  Q = require("q"),
  qfs = require("q-io/fs"),
  mkdirp = require("mkdirp"),
  program = require("commander"),
  uuid = require("node-uuid"),
  G = require("./lib/generate.js"),
  U = require("./lib/utilities.js"),
  config = require("./config.js");

let contentDir = _.partial(path.join, config.contentDir);

program
  .version("0.0.1")

program
  .command("generate")
  .description("generates the site")
  .option("-u, --updated", "regenerates only those posts with the 'update' attribute set to true")
  .option("-a, --all", "Regenerates all the posts")
  .action(function (options) {
    if (options.updated && options.all) {
      return console.log("please choose --updated or --all, but not both");
    }

    if (!options.updated && !options.all) {
      return console.log("please choose either --updated or --all");
    }
    
    if (options.all) {
      G.generateAll();
    } else if (options.updated) {
      G.generateUpdated();
    }
  });

program
  .command("new")
  .description("Creates a new post")
  .option("-t, --title <s>", "Adds a title to the post")
  .action(options => createNewPost(options.title));

program.parse(process.argv);

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
    .tap(_.flow(U.nameContentFolder, contentDir, Q.nfbind(mkdirp)))
    .then(frontmatter =>
      Q.all([
        Q.nfapply(mkdirp, contentDir(U.nameContentFolder(frontmatter), "images")),
        qfs.write(
          contentDir(U.nameContentFolder(frontmatter), "frontmatter.json"),
          JSON.stringify(frontmatter, null, '\t')),
        qfs.write(
          contentDir(U.nameContentFolder(frontmatter), "main.md"),
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
