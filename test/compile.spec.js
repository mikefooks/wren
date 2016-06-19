"use strict";

let assert = require("chai").assert,
  qfs = require("q-io/fs"),
  path = require("path"),
  compile = require("../lib/compile.js"),
  config = {
    contentDir: path.join(__dirname, "fixtures/mockposts")
  };

describe("#__initializePostCollection()", function () {    
  it("returns a collection", function () {
    return compile.__initializePostCollection(config)
      .then(function (posts) {
        assert.isArray(posts);
        return posts;
      })
      .then(function (posts) {
        posts.forEach(function (post) {
          assert.isObject(post);
        });
      });
  });

  it("objects contain a 'dir' property", function () {
    return compile.__initializePostCollection(config)
      .then(function (posts) {
        posts.forEach(function (post) {
          assert.property(post, "dir");
        });
      });
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
        return posts.forEach(function (post) {
          assert.property(post, "frontmatter");
        });
      });
  });  

  it("frontmatter has correct number of attributes", function () {
    return compile.__assignFrontmatter(postCollection)
      .then(function (posts) {
        return posts.forEach(function (post) {
          assert.equal(Object.keys(post.frontmatter).length, 7);
        });
      });
  });

  after(function () {
    postCollection = undefined;
  }); 
});

describe("#__updateSlugs()", function () {
  let postCollection;

  beforeEach(function () {
    postCollection = compile.__initializePostCollection(config)
      .then(compile.__assignFrontmatter)
      .then(function (posts) {
        posts[0].frontmatter.title = "I Have Changed The Title";
        return posts;
      })
      .then(compile.__updateSlugs);
  });

  it("returns a collection", function () {
    return postCollection.then(function (posts) {
      console.log(posts);
      assert.isArray(posts);
      return posts
    }).then(function (posts) {
      posts.forEach(function (post) {
        assert.isObject(post);
      }); 
    });
  });

  after(function () {
    postCollection = undefined;
  });
});
