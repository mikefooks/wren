"use strict";

let assert = require("chai").assert,
  _ = require("lodash"),
  qfs = require("q-io/fs"),
  path = require("path"),
  compile = require("../lib/compile.js").compilePostCollection,
  generate = require("../lib/generate.js"),
  config = {
    siteName: "this_site_is_for_testing",
    contentDir: path.join(__dirname, "fixtures/content"),
    themeDir: path.join(__dirname, "fixtures/theme"),
    publicDir: path.join(__dirname, "fixtures/public")
  };

describe("generate.js --- HTML and Asset Generator Functions", function () {

  describe("#__updatePublicDirs", function () {
    let site;

    beforeEach(function () {
      site = compile(config)
        .tap(function () {
          return qfs.makeTree(config.publicDir);
        })
        .then(generate.__updatePublicDirs);
    });

    it("creates post directories in the public directory", function () {
      return site
        .then(function (compiled) {
          return qfs.isDirectory(compiled.posts[0].target)
            .then(function (stat) {
              assert.isOk(stat);
            });
        });
    });

    it("post directories are named correctly", function () {
      return site
        .then(function (compiled) {
          return qfs.list(config.publicDir)
            .then(function (list) {
              compiled.posts.forEach(function (post) {
                assert.include(list, post.frontmatter.slug);
              });
            });
        });
    });

    afterEach(function () {
      return qfs.removeTree(config.publicDir);
    });
  });

  describe("#__generateIndex()", function () {
    let site,
      target;
 
    beforeEach(function () {
      site = compile(config)
        .tap(function (compiled) {
          return qfs.makeTree(config.publicDir);
        })
        .then(generate.__generateIndex);
    });
 
    it("creates an index page at the correct path", function () {
      return site
        .then(function (compiled) {
          return qfs.isFile(path.join(config.publicDir, "index.html"))
            .then(function (stat) {
              assert.isOk(stat)
            });
        });     
    });

    it("index page contains the correct values", function () {
      return site
        .then(function (compiled) {
          return qfs.read(path.join(config.publicDir, "index.html"))
            .then(function (page) {
              assert.match(page, new RegExp("this_site_is_for_testing"));
              assert.match(page, new RegExp("this_post_is_for_testing"));
            });
        });
    });
 
    it("return value is properly formed site object", function () {
      return site
        .then(function (compiled) {
          assert.isObject(compiled.config);
          assert.isArray(compiled.posts);
          assert.equal(Object.keys(compiled).length, 2);
        });
    });

    afterEach(function () {
      return qfs.removeTree(config.publicDir);
    });
  });

});
