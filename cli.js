"use strict";

var path = require("path"), 
  program = require("commander"),
  uuid = require("node-uuid"),
  H = require("./helpers.js"),
  mkdirp = require("mkdirp");

var CWD = process.cwd();

program
  .version("0.0.1")
  .option("new <s>", "Creates a new post", createNewPost)
  .parse(process.argv);

function createNewPost (title) {
  console.log({
    id: uuid.v4(),
    title: title
  });
};