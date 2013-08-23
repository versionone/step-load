var flow = function(){};
module.exports = flow;

flow.prototype = function(config) {
  
};

flow.run = function() {
  console.log('running')
  return { then : function(callback) { setTimeout(callback, 3000) }}
};
