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
          return qfs.stat(path.join(config.publicDir, "index.html"), function (stat) {
            return assert.isOk(stat.isFile());
          });
        });     
    });

    it("index page contains the correct values", function () {
      return site
        .then(function (compiled) {
          return qfs.read(path.join(config.publicDir, "index.html"))
            .then(function (page) {
              return assert.match(page, new RegExp("this_site_is_for_testing"));
            });
        });
    });
 
    afterEach(function () {
      return qfs.removeTree(config.publicDir);
    });
  });
});
