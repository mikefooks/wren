"use strict";

var path = require("path"), 
  program = require("commander"),
  H = require("./helpers.js"),
  G = require("./generate.js"),
  mkdirp = require("mkdirp");

var CWD = process.cwd();

program
  .version("0.0.1")
  .option("new <s>", "Creates a new post", H.createNewPost)
  .option("generate", "Generates!", G.generateUpdated)
  .parse(process.argv);