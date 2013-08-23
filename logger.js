var logger = function(){}
module.exports = logger;


logger.prototype = function(verbose){
  this.verbose = verbose;
}

logger.prototype.log = function(){
  console.log(Array.prototype.slice.call(arguments));
}
