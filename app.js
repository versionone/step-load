#!/usr/bin/env node
var options = require('optimist').argv;

var config = {};
config.maximumOutstandingRequests = options.load || 10;
config.verbose = options.verbose || false

var Logger = require('./logger');
var logger = new Logger(config.verbose)
logger.log('Starting Step Load');

var flows = require('./flows').flows;
console.log(flows)
var currentOutstandingRequests = 0;

while (true) {
  var flowNumber = Math.floor(Math.random() * flows.length);
  console.log(flowNumber)
  var flow = flows[flowNumber];
  flow.run(config).then(function(){ currentOutstandingRequests--; });

  if (currentOutstandingRequests >= config.maximumOutstandingRequests)
  {
    //sleep is not an option
    //recursive settimeout instead of while loop
  }
}
