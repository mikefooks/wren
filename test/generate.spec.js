"use strict";

let assert = require("chai").assert,
  qfs = require("q-io/fs"),
  path = require("path"),
  compile = require("../lib/compile.js").compilePostCollection,
  generate = require("../lib/generate.js"),
  config = {
    contentDir: "fixtures/content",
    themeDir: "fixtures/theme",
    publicDir: "fixtures/public"
  };

describe("#__generateIndex()", function () {
  let site,
    target;

  beforeEach(function () {
    site = compile(config)
      .then(function (site) {
        target = site.posts[0].target;
      });
  });

  it("post directory is created", function () {
    site
      .then(function (generated) {
        return qfs.stat(target)
          .tap(function (stat) {
            console.log(stat.isDirectory());
          })
          .then(function (stat) {
            assert.equal(true, false);
          });
      });
  });

  afterEach(function () {
    site = undefined;
    target = undefined;
  });
});
