"use strict";

var _ = require("lodash");

module.exports = {
  slugify: function (str) {
    return _.snakeCase(str.replace(/[^\w\s]/g, ""));
  },
  createContentFolder: function (name) {
    
  }
};