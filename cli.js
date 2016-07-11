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

program
  .version("0.0.1")

program
  .command("generate")
  .description("generates the site")
  .action(G.generateAll);

program
  .command("new")
  .description("Creates a new post")
  .option("-t, --title <s>", "Adds a title to the post")
  .action(options => createNewPost(options.title));

program.parse(process.argv);
