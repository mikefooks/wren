"use strict";

let Q = require("q"),
  fs = require("fs"),
  rmrf = require("rimraf"),
  mkdirp = require("mkdirp");

module.exports = {
  fsReadDir: Q.nfbind(fs.readdir),
  fsReadFile: Q.nfbind(fs.readFile),
  fsMkDir: Q.nfbind(fs.mkdir),
  rimraf: Q.nfbind(rmrf),
  fsExists: Q.nfbind(fs.exists),
  mkDirP: Q.nfbind(mkdirp),
  fsWriteFile: Q.nfbind(fs.writeFile)
};
