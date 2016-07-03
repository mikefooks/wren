"use strict";

let assert = require("chai").assert,
  _ = require("lodash"),
  qfs = require("q-io/fs"),
  path = require("path"),
  compile = require("../lib/compile.js").compilePostCollection,
  generate = require("../lib/generate.js"),
  config = {
    contentDir: path.join(__dirname, "fixtures/content"),
    themeDir: path.join(__dirname, "fixtures/theme"),
    publicDir: path.join(__dirname, "fixtures/public")
  };
