"use strict";

let path = require("path"),
  program = require("commander"),
  generate = require("./lib/generate.js").generateAll,
  create = require("./lib/create.js").createNewPost,
  config = require("./config.js");

program
  .version("0.0.1")

program
  .command("generate")
  .description("generates the site")
  .action(generate);

program
  .command("new")
  .description("Creates a new post")
  .option("-t, --title <s>", "Adds a title to the post")
  .action(options => create(config, options.title));

program.parse(process.argv);
