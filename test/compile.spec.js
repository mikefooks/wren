"use strict";

let assert = require("chai").assert,
  sinon = require("sinon"),
  Q = require("q"),
  qfs = require("q-io/fs"),
  path = require("path"),
  compile = require("../lib/compile.js"),
  config = {
    contentDir: path.join(__dirname, "fixtures/mockposts"),
    publicDir: path.join(__dirname, "fakePublic")
  };

function isCollection (p) {
  return Q.resolve(p).then(function (coll) {
    assert.isArray(coll);
    return coll;
  }).then(function (coll) {
    coll.forEach(function (item) {
      assert.isObject(item);
    });
    return coll;
  });
}

describe("#__initializePostCollection()", function () {    
  it("returns a collection", function () {
    return compile.__initializePostCollection(config)
      .then(function (site) {
        return isCollection(site.posts);
      });
  });

  it("objects contain a 'dir' property", function () {
    return compile.__initializePostCollection(config)
      .then(function (site) {
        site.posts.forEach(function (post) {
          assert.property(post, "source");
        });
      });
  });
});

describe("#__assignFrontmatter()", function () {
  let postCollection;

  beforeEach(function () {
    postCollection = compile.__initializePostCollection(config);
  });

  it("returns a collection", function () {
    return postCollection.then(compile.__assignFrontmatter)
      .then(function (site) {
        return isCollection(site.posts);
      });
  });

  it("post objects have 'frontmatter' property", function () {
    return postCollection.then(compile.__assignFrontmatter)
      .then(function (site) {
        return site.posts.forEach(function (post) {
          assert.property(post, "frontmatter");
        });
      });
  });  

  it("frontmatter has correct number of attributes", function () {
    return postCollection.then(compile.__assignFrontmatter)
      .then(function (site) {
        return site.posts.forEach(function (post) {
          assert.equal(Object.keys(post.frontmatter).length, 7);
        });
      });
  });

  afterEach(function () {
    postCollection = undefined;
  }); 
});

describe("#__updateSlugs()", function () {
  let postCollection;

  beforeEach(function () {
    postCollection = compile.__initializePostCollection(config)
      .then(compile.__assignFrontmatter)
  });

  it("returns a collection", function () {
    return postCollection
      .then(function (site) {
        site.posts[0].frontmatter.title = "I Have Changed The Title";
        return site;
      })
      .then(compile.__updateSlugs)
      .then(function (site) {
        return isCollection(site.posts);
      });
  });

  it("updates the slug based on the new title", function () {
    return postCollection
      .then(function (site) {
        assert.equal(site.posts[0].frontmatter.slug, "this_post_is_for_testing");
        return site
      }).then(function (site) {
        site.posts[0].frontmatter.title = "I Have Changed The Title";
        return site;
      }).then(compile.__updateSlugs)
      .then(function (site) {
        assert.equal(site.posts[0].frontmatter.slug, "i_have_changed_the_title");
      });
  });

  afterEach(function () {
    postCollection = undefined;
  });
});

describe("#__assignTargetDir()", function () {
  let postCollection;

  beforeEach(function () {
    postCollection = compile.__initializePostCollection(config)
      .then(compile.__assignFrontmatter)
      .then(compile.__updateSlugs)
  });

  it("should do something", function () {
    return postCollection
      .then(compile.__assignTargetDir)
      .then(function (site) {
        return site;
      })
      .then(function (site) {
        assert.isArray(site.posts);
      });
  });

  it("each post object has a 'target property'", function () {
    return postCollection
      .then(compile.__assignTargetDir)
      .then(function (site) {
        site.posts.forEach(function (post) {
          assert.property(post, "target");
        });
      });
  });

  afterEach(function () {
    postCollection = undefined;
  });
});
