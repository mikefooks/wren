"use strict";

let assert = require("chai").assert,
  qfs = require("q-io/fs"),
  path = require("path"),
  compile = require("../lib/compile.js");

describe("lib/compile.js --- post compilation functions", function () {    
  let contentDir = path.join(__dirname, "fixtures/mockposts/"),
    postDirs; 

  beforeEach(function () {
    postDirs = qfs.list(contentDir);
  }); 

  it("#__obtainContentDirs()", function () {
    postDirs
      .then(compile.__obtainContentDirs)
      .then(function (posts) {
        console.log(posts);
        assert.equals(posts.length, 1);
      });
  });

  afterEach(function () {
  });
});
