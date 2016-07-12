"use strict";

let assert = require("chai").assert,
  path = require("path"),
  create = require("../lib/create.js"),
  config = {
    author: "Bill Testsalot",
    contentDir: path.join(__dirname, "fixtures/content"),
    publicDir: path.join(__dirname, "fixtures/public")
  };

describe("create.js --- New post creation functions", function () {
  describe("#__createDefaultFrontmatter", function () {
    it("returns a promise for an object", function () {
      return create.__createDefaultFrontmatter(config, "check it out!")
        .then(function (post) {
          assert.isObject(post);
        });
    });

    it("returns an object with the right number of keys", function () {
      return create.__createDefaultFrontmatter(config, "another thing!")
        .then(function (post) {
          assert.equal(Object.keys(post).length, 2);
          assert.equal(Object.keys(post.frontmatter).length, 8);
        });
    });

    it("contains the correct values", function () {
      return create.__createDefaultFrontmatter(config, "more tests, please")
        .then(function (post) {
          assert.equal(post.frontmatter.author, "Bill Testsalot");
          assert.isString(post.frontmatter.created);
        });
    });
  });
});
