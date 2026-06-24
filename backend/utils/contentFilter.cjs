const Filter = require("bad-words");
const filter = new Filter();

function clean(text) {
  return filter.clean(text);
}

module.exports = { clean };
