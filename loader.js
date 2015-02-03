var _ = require('underscore')
var when = require('when')
var nodefn = require('when/node/function')
var apply = require('when/apply')
var unfold = require('when/unfold')
var sequence = require('when/sequence')
var parallel = require('when/parallel')
var request = require('request')
var Url = require('url')

var promise = {
	request: nodefn.lift(request)
}

var buildHttpTransaction = apply(function buildHttpTransaction(res) {
	var httpTransaction = {
		request: {
			href: res.request.href,
			host: res.request.host,
			port: res.request.port,
			method: res.request.method,
			path: res.request.path,
			headers: res.req._headers,
			cookies: _.map(res.request._jar.cookies, function(cookie) {return cookie.str})
		},
		response: {
			httpVersion: res.httpVersion,
			statusCode: res.statusCode,
			headers: res.headers,
			body: res.body
		}
	}
	//console.log('HTTP', httpTransaction)

	if (httpTransaction.response.statusCode < 200 || httpTransaction.response.statusCode >= 300) {
		var exception = _.extend(new Error('HTTP Error'), httpTransaction)
		try {
			if (httpTransaction.response.headers['content-type'].indexOf('application/json') === 0) {
				exception = JSON.parse(httpTransaction.response.body)
			}
		}
		catch (e) {}
		throw exception
	}
	return httpTransaction
})

function fromJson(httpTransaction) {
	return JSON.parse(httpTransaction.response.body)
}

promise.api = (function (request, buildHttpTransaction, fromJson) {
	return function promiseApi(url, session, method) {
		return when.join(url, session).then(apply(function (url, session) {
			url = Url.parse(url, true, true)
			url.query.Accept = 'application/json'
			url = url.format()
			//console.log('URL', url)
			var options = _.extend({ url: url, method: method }, session.requestOptions)
			return request(options)
				.then(buildHttpTransaction)
				.then(fromJson)
		}))
	}
})(promise.request, buildHttpTransaction, fromJson)


function log(label) {
	return function (value) {
		console.log(label, value)
		return value
	}
}

var baseUri = 'http://RADON/V/'


promise.session = (function() {
	var adminSession = createSession('admin')
	var usernamesQuery = baseUri + "rest-1.v1/Data/Member?sel=Username&where=UsesLicense='true'&Accept=application/json"
	var usernames = promiseUsernames()

	function promiseUsernames() {
		return promise.api(usernamesQuery, adminSession)
			.then(extractUsernames)
	}

	function extractUsernames(data) {
		return _.map(data.Assets, extractUsername)
	}

	function extractUsername(asset) {
		return asset.Attributes.Username.value
	}

	var sessions = {}

	return function promiseSession() {
		return when(usernames).then(function (usernames) {
			var username = _.sample(usernames)
			return sessions[username] || (sessions[username] = createSession(username))
		})
	}

	function createSession(username) {
		return {
			username: username,
			requestOptions: {
				auth: { user: username, pass: 'password' },
				headers: { 'User-Agent': 'loader/' + username },
				jar: request.jar()
			}
		}
	}
})()



var threads = {
	current: 0,
	target: 27,
	throttle: 3,
	started: 0,
	finished: 0,
	errored: 0
}
require('http').globalAgent.maxSockets = threads.target
require('https').globalAgent.maxSockets = threads.target

var scenarios = require('./scenarios')

function startThreads() {
	var deficit = threads.target - threads.current
	var toStart = Math.max(0, Math.min(threads.throttle, deficit))
	for (var i = 0; i < toStart; ++i)
		startThread()
}

function startThread() {
	startScenario()
		.otherwise(function () { ++threads.errored })
		.ensure(endThread)
	++threads.current
	++threads.started
	//console.log('Threads', threads.current)
}

function endThread() {
	threads.currentTime = Date.now()
	--threads.current
	++threads.finished
	threads.succeeded = threads.finished - threads.errored
	threads.errorRate = 100.0 * threads.errored / threads.finished
	threads.elapsedTime = threads.currentTime - threads.startTime
	threads.throughput = 1000.0 * threads.succeeded / threads.elapsedTime
	//console.log('Threads', threads)
	console.log('%d Throughput=%s Errors=%d (%s%%)', threads.finished, threads.throughput.toFixed(4), threads.errored, threads.errorRate.toFixed(1))
	startThreads()
}

function startScenario() {
	var scenario = chooseScenario()
	return when(promise.session())
		.then(function (session) { return new scenario(baseUri, session, promise.api) })
		.then(function (flow) { return flow.run() })
		//.then(apply(console.log))
		.otherwise(function (err) {
			if (err) {
				console.error(scenario.name, err)
				throw err
			}
		})
}

var scenarioIndex = 0
function chooseScenario() {
	var scenario = scenarios[scenarioIndex++]
	if (scenarioIndex >= scenarios.length)
		scenarioIndex = 0
	return scenario
	//return _.sample(scenarios)
}

threads.startTime = Date.now()
startThreads()


