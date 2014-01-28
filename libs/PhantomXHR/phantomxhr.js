var require = patchRequire(require);

exports.init = phantomXHRInit;
exports.fake = fake;
exports.requests = getAllRequests;

var page;

function phantomXHRInit(initPage){
	
	var inject = false;

	if(initPage.injectJs){
		inject = initPage.injectJs('./modules/PhantomXHR/sinon.js');
	}
	
	if(inject){
		page = initPage;
		setup();
	} else {
		console.log("Can't find sinon.js");
	}
}

function setup(){
	page.evaluate(function () {

		if (!window._ajaxmock_) {
			window._ajaxmock_ = {
				matches: [],
				requests: {},
				call: {},
				fake: function (match) {

					function S4() {
						return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
					}

					function makeGuid() {
						return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
					}

					var urlIsString = match.url.indexOf('REGEXP') === -1;
					var guid = makeGuid();

					match.guid = guid;
					match.url = match.url.replace('REGEXP', '');

					console.log('[FAKE XHR] Match added [' + (match.method || 'All REST verbs') + "] : " + match.url + "'");

					match.requests = [];
					match.responses = [];
					window._ajaxmock_.call[guid] = match;

					window._ajaxmock_.matches.push(function (method, url) {

						if (!url) {
							return false;
						}

						var urlMatch = urlIsString ? url.indexOf(match.url) !== -1 : new RegExp(match.url).test(url);
						var methodMatch = (typeof match.method === 'undefined') ? true : match.method.toLowerCase() === method.toLowerCase();

						if (urlMatch && methodMatch) {
							return match;
						} else {
							return false;
						}
					});

					return guid;
				},
				init: function () {
					var _xhr = window.sinon.useFakeXMLHttpRequest();

					_xhr.onCreate = function (request) {
						setTimeout(function () {
							var anyMatches = false;
							var requests = window._ajaxmock_.requests;

							if (!request.url) {
								console.log('NO XHR URL');
								return;
							} // this shouldn't happen, but sometimes does
							// store the request for later matching
							if (requests[request.method.toLowerCase() + request.url]) {
								requests[request.method.toLowerCase() + request.url].count++;
							} else {
								requests[request.method.toLowerCase() + request.url] = {
									data: request,
									count: 1
								};
							}

							window._ajaxmock_.matches.reverse().forEach(function (func) {
								anyMatches = anyMatches || func(request.method, request.url);
							});

							if (anyMatches) {
								respond(request, anyMatches);
							} else {
								console.log('[FAKE XHR] did not respond to ' + request.method + ' ' + request.url);
							}
						}, 100);
					};
				}
			};
			window._ajaxmock_.init();
		}

		function respond(request, response) {

			if(!window._ajaxmock_){
				console.log('[FAKE XHR] could not respond, window._ajaxmock_ does not exist.');
				return;
			}

			var call = window._ajaxmock_.call;
			var callForThisMatch;
			var responseForThisMatch;
			var status;
			var body;

			console.log('[FAKE XHR] gonna respond to ' + request.method + ": " + request.url + "'");

			callForThisMatch = call[response.guid];
			callForThisMatch.requests.push(request);

			responseForThisMatch = callForThisMatch.responses[callForThisMatch.requests.length];

			if (responseForThisMatch) {
				status = responseForThisMatch.status;
				body = responseForThisMatch.responseBody;
				console.log('[FAKE XHR] with status: ' + responseForThisMatch.status);
			}

			console.log('[FAKE XHR] with status: ' + response.status);

			request.respond(
			status || response.status || 200, response.headers || {
				"Content-Type": "application/json"
			}, body || response.responseBody || '');
		}
	});
}

function fake(options) {
	var url = !! options.url.source ? 'REGEXP' + options.url.source : options.url;

	if(typeof(options.responseBody) === "object"){
		options.responseBody = JSON.stringify(options.responseBody);
	}

	var guid = page.evaluate(function (url, method, responseBody, status, headers) {
		if (window._ajaxmock_ && url) {

			if (responseBody && headers && headers["Content-Type"] && headers["Content-Type"] === "application/json") {
				try {
					JSON.parse(responseBody);
				} catch (e) {
					return 'JSON';
				}
			}

			console.log("sending mock response for " + url);
			return window._ajaxmock_.fake({
				url: url,
				method: method,
				responseBody: responseBody,
				status: status,
				headers: headers
			});
		}
	}, url, options.method, options.responseBody, options.status, options.headers);

	if (guid === 'JSON') {
		console.log('[FAKE FAILED] JSON was invalid : ' + options.method + ' : ' + url);
	}

	return {
		count: function () {
			var c = page.evaluate(function (guid) {
				if( !(window._ajaxmock_ && window._ajaxmock_.call[guid] )){
					return;
				}
				return window._ajaxmock_.call[guid].requests.length;
			}, guid);

			if(typeof c === 'undefined'){
				console.log('[PhantomXHR] Could not get count');
			}

			return c;
		},

		nthRequest: function (index) {
			var r = page.evaluate(function (guid, index) {
				if( !(window._ajaxmock_ && window._ajaxmock_.call[guid] )){
					return;
				}
				var request = window._ajaxmock_.call[guid].requests[index - 1];
				return request.requestBody;
			}, guid, index);

			if(typeof r === 'undefined'){
				console.log('[PhantomXHR] Could not get request');
			}

			return r;
		},

		nthRequestOrNull: function (index) {
			var r = page.evaluate(function (guid, index) {
				if( !(window._ajaxmock_ && window._ajaxmock_.call[guid] )){
					return;
				}
				var request = window._ajaxmock_.call[guid].requests[index - 1];
				if (!request) { return null; }
				return request;
			}, guid, index);

			if(typeof r === 'undefined'){
				console.log('[PhantomXHR] Could not get request');
			}

			return r;
		},

		last: function () {
			var last = page.evaluate(function (guid) {
				return window._ajaxmock_.call[guid].requests.length;
			}, guid);

			return this.nthRequest(last);
		},

		first: function () {
			return this.nthRequest(1);
		},

		firstOrNull: function () {
			return this.nthRequestOrNull(1);
		},

		nthResponse: function (num, response) {
			var r = page.evaluate(function (guid, num, response) {
				if (typeof(response.responseBody) === "object") {
					response.responseBody = JSON.stringify(response.responseBody);
				}
				if( !(window._ajaxmock_ && window._ajaxmock_.call[guid] )){
					return;
				}
				window._ajaxmock_.call[guid].responses[num] = response;
				return true;
			}, guid, num, response );

			if(typeof r === 'undefined'){
				console.log('[PhantomXHR] Could not set response');
			}

			return this;
		},

		uri: options.url,
		method: options.method
	};
}

function getAllRequests() {
	var requests = page.evaluate(function () {
		var requests = {};

		if (window._ajaxmock_) {
			requests = window._ajaxmock_.requests;
		}

		return requests;
	});

	return requests;
}