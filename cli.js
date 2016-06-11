"use strict";

let path = require("path"),
  _ = require("lodash"),
  Q = require("q"),
  qfs = require("q-io/fs"),
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
      slug: title ? U.slugify(title) : id,
      created,
      modified: created,
      keywords: [],
      update: true
    };

  return Q.resolve(frontmatter);
}

function createNewPost (title) {
  return createDefaultFrontMatter(title)
    .then(frontmatter => {
      let postDir = _.flow(U.nameContentFolder, contentDir)(frontmatter);
      return [frontmatter, postDir];
    })
    .tap((args) => qfs.makeTree(args[1]))
    .spread((frontmatter, postDir) => {
      return Q.all([
        qfs.write(
          path.join(postDir, "frontmatter.json"),
          JSON.stringify(frontmatter, null, '\t')),
        qfs.write(
          path.join(postDir, "main.md"),
          "<!-- Write your post here! -->")
      ])
    });
}
