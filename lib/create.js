"use strict";

let qfs = require("q-io/fs"),
  Q = require("q"),
  _ = require("lodash"),
  path = require("path"),
  U = require("./utilities.js"),
  uuid = require("node-uuid");


function __nameContentFolder(frontmatter) {
  let dateString = frontmatter.created
    .substring(0, 10)
    .replace(/\-/g, "_");

  return [dateString, frontmatter.slug].join("_");
}

/**
 * Is fed the title through the cli's new command and builds an object
 * which will ultimately become the new post's frontmatter.json file.
 * @param  { String } title   The String title for the new post.
 * @return { Q Promise }      A fulfilled Q promise bearing the new
 *                            frontmatter object.
 */
function __createDefaultFrontmatter (config, title) {
  let created = new Date().toISOString(),
    id =  uuid.v4(),
    post = {
      config,
      frontmatter: {
        id,
        title: title || "",
        author: config.author,
        slug: title ? U.slugify(title) : id,
        created,
        modified: created,
        keywords: [],
        update: true
      }
    };

  return Q.resolve(post);
}

/**
 * Takes the config object and an optional title for the new post and
 * creates the directories and necessary files.
 *
 * @param config
 * @param title
 */
function createNewPost (config, title) {
  return __createDefaultFrontmatter(config, title)
    .then(post => {
      let postDir = path.join(
        post.config.publicDir,
        __nameContentFolder(post.frontmatter)
      );

      return [post, postDir];
    })
    .then(args => {
      return qfs.makeTree(args[1])
        .then(() => args);
    })
    .spread((frontmatter, postDir) => {
      return Q.all([
        qfs.write(
          path.join(postDir, "frontmatter.json"),
          JSON.stringify(post.frontmatter, null, '\t')),
        qfs.write(
          path.join(postDir, "main.md"),
          "<!-- Write your post here! -->")
      ])
    })
    .fail(console.log);
}

module.exports = {
  __nameContentFolder,
  __createDefaultFrontmatter,
  createNewPost
};
