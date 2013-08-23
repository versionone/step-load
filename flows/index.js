exports.flows = []
require("fs").readdirSync("./flows").forEach(function(file) {
  if (file === "index.js") return;
  exports.flows.push(require('./' + file));
});