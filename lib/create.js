"use strict";

let qfs = require("q-io/fs"),
  Q = require("q"),
  _ = require("lodash"),
  path = require("path"),
  U = require("./utilities.js"),
  uuid = require("node-uuid");

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

function createNewPost (config, title) {
  return createDefaultFrontMatter(config, title)
    .then(frontmatter => {
      let postDir = _.flow(U.nameContentFolder, contentDir)(frontmatter);
      return [frontmatter, postDir];
    })
    .then(args => {
      return qfs.makeTree(args[1])
        .then(() => args);
    })
    .spread((frontmatter, postDir) => {
      return Q.all([
        qfs.write(
          path.join(postDir, "frontmatter.json"),
          JSON.stringify(frontmatter, null, '\t')),
        qfs.write(
          path.join(postDir, "main.md"),
          "<!-- Write your post here! -->")
      ])
    })
    .fail(console.log);
}

module.exports = {
  __createDefaultFrontmatter,
  createNewPost
};
