const yaml = require("js-yaml");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
};
