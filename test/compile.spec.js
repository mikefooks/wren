"use strict";

let assert = require("chai").assert,
  qfs = require("q-io/fs"),
  path = require("path"),
  compile = require("../lib/compile.js");

describe("#__initializePostCollection()", function () {    
  let config;

  before(function () {
    config = {
      contentDir: path.join(__dirname, "fixtures/mockposts")
    };
  });

  it("returns a collection", function () {
    return compile.__initializePostCollection(config)
      .then(function (posts) {
        let postsAreObjects = posts.every(function (post) {
          return typeof post == "object";
        });

        assert.equal(postsAreObjects, true);
      });
  });

  it("objects contain a 'dir' property", function () {
    return compile.__initializePostCollection(config)
      .then(function (posts) {
        let containsDirProp = posts.every(function (post) {
          return post.hasOwnProperty("dir") == true;
        });

        assert.equal(containsDirProp, true);
      });
  });

  after(function () {
    config = undefined;
  });
});

describe("#__assignFrontmatter()", function () {
  let postCollection;

  before(function () {
    postCollection = [{
      dir: path.join(__dirname,
        "fixtures/mockposts",
        "2016_06_13_this_post_is_for_testing")
    }];  
  });

  it("post objects have 'frontmatter' property", function () {
    return compile.__assignFrontmatter(postCollection)
      .then(function (posts) {
        let postsHaveFrontmatter = posts.every(function (post) {
          return post.hasOwnProperty("frontmatter");
        });

        assert.equal(postsHaveFrontmatter, true);
      });
  });  

  it("frontmatter has correct number of attributes", function () {
    return compile.__assignFrontmatter(postCollection)
      .then(function (posts) {
        let correctFmProperties = posts.every(function (post) {
          return Object.keys(post.frontmatter).length == 7;
        });

        assert.equal(correctFmProperties, true);
      });
  });
  
  after(function () {
    postCollection = undefined;
  }); 
});
