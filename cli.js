"use strict";

var path = require("path"), 
  program = require("commander"),
  uuid = require("node-uuid"),
  H = require("./helpers.js"),
  mkdirp = require("mkdirp");

var CWD = process.cwd();

program
  .version("0.0.1")
  .option("new <s>", "Creates a new post", H.createContentFolder)
  .parse(process.argv);