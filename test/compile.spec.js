"use strict";

let assert = require("chai").assert,
  qfs = require("q-io/fs"),
  path = require("path"),
  compile = require("../lib/compile.js");

describe("#__obtainContentDirs()", function () {    
  let config = {
    contentDir: path.join(__dirname, "fixtures/mockposts")
  };

  it("returns a collection", function () {
    return compile.__obtainContentDirs(config)
      .then(function (posts) {
        let postsAreObjects = posts.every(function (post) {
          return typeof post == "object";
        });

        assert.equal(postsAreObjects, true);
      });
  });
});
