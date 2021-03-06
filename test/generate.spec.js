"use strict";

let assert = require("chai").assert,
  _ = require("lodash"),
  qfs = require("q-io/fs"),
  path = require("path"),
  compile = require("../lib/compile.js").compilePostCollection,
  generate = require("../lib/generate.js"),
  mockConfig = {
    siteName: "this_site_is_for_testing",
    contentDir: path.join(__dirname, "fixtures/content"),
    themeDir: path.join(__dirname, "fixtures/theme"),
    publicDir: path.join(__dirname, "fixtures/public")
  };

describe("generate.js --- HTML and Asset Generator Functions", function () {

  describe("#__updatePublicDirs", function () {
    let site;

    beforeEach(function () {
      site = compile(mockConfig)
        .then(function (compiled) {
          return qfs.makeTree(mockConfig.publicDir)
            .then(() => compiled);
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
          return qfs.list(mockConfig.publicDir)
            .then(function (list) {
              compiled.posts.forEach(function (post) {
                assert.include(list, post.frontmatter.slug);
              });
            });
        });
    });

    afterEach(function () {
      return qfs.removeTree(mockConfig.publicDir);
    });
  });

  describe("#__generateIndex()", function () {
    let site,
      target;
 
    beforeEach(function () {
      site = compile(mockConfig)
        .then(function (compiled) {
          return qfs.makeTree(mockConfig.publicDir)
            .then(() => compiled);
        })
        .then(generate.__generateIndex);
    });
 
    it("creates an index page at the correct path", function () {
      return site
        .then(function (compiled) {
          return qfs.isFile(path.join(mockConfig.publicDir, "index.html"))
            .then(function (stat) {
              assert.isOk(stat)
            });
        });     
    });

    it("index page contains the correct values", function () {
      return site
        .then(function (compiled) {
          return qfs.read(path.join(mockConfig.publicDir, "index.html"))
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
      return qfs.removeTree(mockConfig.publicDir);
    });
  });

  describe("#__generatePosts()", function () {
    let site;

    beforeEach(function () {
      return site = compile(mockConfig)
        .then(function (compiled) {
          return qfs.makeTree(mockConfig.publicDir)
            .then(() => compiled);
        })
        .then(generate.__updatePublicDirs)
        .then(generate.__generatePosts);
    });

    it("generates index.html in each post directory", function () {
      return site
        .then(function (compiled) {
          return qfs.stat(path.join(compiled.posts[0].target, "index.html"))
            .then(function (stat) {
              assert.isOk(stat.isFile());
            });
        });
    });

    it("post index.html has the correct content", function () {
      return site
        .then(function (compiled) {
          return qfs.read(path.join(compiled.posts[0].target, "index.html"))
            .then(function (page) {
              assert.match(page, new RegExp("this_post_is_so_cool"));
            });
        }); 
    });

    afterEach(function () {
      return qfs.removeTree(mockConfig.publicDir);
    });
  });

  describe("#__copyAssets()", function () {
    let site;

    beforeEach(function () {
      return site = compile(mockConfig)
        .then(function (compiled) {
          return qfs.makeTree(mockConfig.publicDir)
            .then(() => compiled);
        })
        .then(generate.__copyAssets);
    });

    it("copies CSS files correctly", function () {
      return site
        .then(function (compiled) {
          return qfs.stat(path.join(mockConfig.publicDir, "stylies.css"))
            .then(function (stat) {
              assert.isOk(stat.isFile());
            });
        });
    });

    it("copies JS files correctly", function () {
      return site
        .then(function (compiled) {
          return qfs.stat(path.join(mockConfig.publicDir, "script.js"))
            .then(function (stat) {
              assert.isOk(stat.isFile());
            });
        });
    });

    afterEach(function () {
      return qfs.removeTree(mockConfig.publicDir);
    });
  });
});
