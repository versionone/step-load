var _ = require('underscore')
var Url = require('url')

function CopyStory(baseUri, session, promiseApi) {
	baseUri = Url.parse(baseUri, true, true)
	var state = session[this] || (session[this] = {})

	function getRandomStory() {
		var storyCount = getStoryCount()
		var index = randomIndex(storyCount)
		var query = storyQuery(index)
		return queryStory(query)
			.tap(updateStoryCount)
			.then(extractHref)
	}

	function getStoryCount() {
		return state.storyCount || 1000
	}

	function randomIndex(count) {
		return _.random(count - 1)
	}

	function storyQuery(index) {
		var url = baseUri.resolveObject('rest-1.v1/Data/Story')
		url.query = {
			sel: '',
			where: "CheckCopy='true';Scope.AssetState!='Closed'",
			page: [1, index].toString()
		}
		return url
	}

	function queryStory(url) {
		return promiseApi(url, session)
	}

	function updateStoryCount(data) {
		state.storyCount = data.total
	}

	function extractHref(data) {
		if (!data.Assets || !data.Assets.length) throw null
		return data.Assets[0].href
	}

	function copyStory(href) {
		var url = baseUri.resolveObject(href)
		url.query = { op: 'Copy' }
		return promiseApi(url, session, 'POST')
	}

	function extractNewOid(data) {
		return data.id
	}

	function report(oid) {
		return ['New Story', oid]
	}

	this.run = function () {
		return getRandomStory()
			.then(copyStory)
			.then(extractNewOid)
			.then(report)
	}
}

CopyStory.prototype.toString = function CopyStory_toString() { return "CopyStory" }

module.exports = CopyStory