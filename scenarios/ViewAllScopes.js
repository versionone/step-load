
function ViewAllScopes(baseUri, session, promiseApi) {
	function selectAllScopes() {
		url = baseUri + "rest-1.v1/Data/Scope?sel=Parent,ScopeLabels,Schedule,Name,AssetState,IsInactive,Workitems:Story.@Count&sort=Name&Accept=application/json"
		return promiseApi(url, session)
	}

	function extractCount(data) {
		return ['# Projects', data.total]
	}

	this.run = function run() {
		return selectAllScopes()
			.then(extractCount)
	}
}

ViewAllScopes.prototype.toString = function ViewAllScopes_toString() { return "ViewAllScopes" }

module.exports = ViewAllScopes