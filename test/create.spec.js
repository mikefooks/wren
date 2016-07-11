"use strict";

let assert = require("chai").assert,
  path = require("path"),
  create = require("../lib/create.js"),
  config = {
    contentDir: path.join(__dirname, "fixtures/content"),
    publicDir: path.join(__dirname, "fixtures/public")
  };

describe("create.js --- New post creation functions", function () {
  describe("#__createDefaultFrontmatter", function () {
    it("returns a promise for an object", function () {
      return create.__createDefaultFrontmatter(config, "check it out!")
        .then(function (fm) {
          assert.isObject(fm);
        });
    });

    it("returns an object with the right number of keys", function () {
      return create.__createDefaultFrontmatter(config, "another thing!")
        .then(function (fm) {
          assert.equal(Object.keys(fm).length, 8);
        });
    });
  });
});
