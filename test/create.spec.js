"use strict";

let assert = require("chai").assert,
  qfs = require("q-io/fs"),
  path = require("path"),
  create = require("../lib/create.js"),
  config = {
    author: "Bill Testsalot",
    contentDir: path.join(__dirname, "fixtures/content"),
    publicDir: path.join(__dirname, "fixtures/public")
  };

describe("create.js --- New post creation functions", function () {
  describe("#__createDefaultFrontmatter()", function () {
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

  describe("#createNewPost()", function () {
    let newPost,
      postDir;

    beforeEach(function () {
      newPost = create.createNewPost(config, "Hey, A Post")
        .then(function (post) {
          postDir = create.__nameContentDir(post.frontmatter);
          return post;
        });
    });

    it("returns a properly formed post object", function () {
      return newPost.then(function (post) {
        assert.isObject(post);
      });
    });

    it("creates a new directory in the content directory", function () {
      return newPost.then(function (post) {
        return qfs.stat(path.join(config.contentDir, postDir))
          .then(function (stat) {
            assert.isOk(stat.isDirectory())
          });
      });
    });

    it("creates the default frontmatter.json in the post directory", function () {
      return newPost.then(function (post) {
        return qfs.stat(path.join(config.contentDir, postDir, "frontmatter.json"))
          .then(function (stat) {
            assert.isOk(stat.isFile());
          });
      });
    });

    it("creates the blank markdown file in the post directory", function () {
      return newPost.then(function (post) {
        return qfs.stat(path.join(config.contentDir, postDir, "main.md"))
          .then(function (stat) {
            assert.isOk(stat.isFile());
          });
      });
    });

    afterEach(function () {
      qfs.removeTree(path.join(config.contentDir, postDir))
        .then(function () {
          newPost = undefined;
          postDir = undefined;
        });
    });
  });
});
