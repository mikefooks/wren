"use strict";

let marked = require("marked"),
  renderer = new marked.Renderer();

/**
 * This mess is the img rendering function for marked; it replaces the
 * regular image rendering with a picture element and all the
 * source elements that it contains, based on the responsive image
 * settings enumerated in the config file.
 */
renderer.image = function (href, title, text) {
  let src = _.sortBy(config.responsiveImages, "breakpoint"),
    img = src.splice(0, 1),
    tags = _.map(src.reverse(), (props) =>
      "<source srcset='" +
      path.join("images", href.replace(imageRe, "_" + props.size + "$1")) +
      "' media='(min-width: " + props.breakpoint + "px)'>");

  tags.push("<img srcset='" +
    path.join("images", href.replace(imageRe, "_" + img[0].size + "$1")) +
    "' alt='" + text + "'/>\n"
  );

  return "<picture>\n" + tags.join("\n") + "</picture>\n";
}

module.exports = renderer;
