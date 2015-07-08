"use strict";

var path = require("path"),
  _ = require("lodash"), 
  gm = require("gm"),
  Q = require("q");

var contentDir = path.join(process.cwd(), "content"),
  origPath = _.partial(path.join, contentDir,
    "2015_07_08_this_is_another_test",
    "images");

function extractChannel (channel, path, target) {
  return Q.promise(function (resolve, reject) {
    gm(path)
      .channel(channel)
      .autoOrient()
      .resize(500)
      .write(target, function (err) {
        if (err) { 
          return reject(err);
        } else {
          return resolve();
        }
      });
  });
}

Q.all([
  extractChannel("red", origPath("IMG_1668.JPG"), origPath("red.jpg")),
  extractChannel("blue", origPath("IMG_1668.JPG"), origPath("blue.jpg"))
])
.then(console.log)
.fail(console.log);


