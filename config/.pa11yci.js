const viewports = process.env.PA11Y_VIEWPORTS || [
	{
		width: 1440,
		height: 1220
	}
];

const smoke = require('./test/smoke.js');

const urls = [];

const config = {
	defaults: {
		page: {},
		timeout: 50000,
		hideElements: 'iframe[src*=google],iframe[src*=proxy]',
		rules: ['Principle1.Guideline1_3.1_3_1_AAA']
	},
	urls: []
}


// What routes returning 200 in smoke.js should we not test?
// set per-project in PA11Y_ROUTE_EXCEPTIONS in config-vars
const exceptions = process.env.PA11Y_ROUTE_EXCEPTIONS ? process.env.PA11Y_ROUTE_EXCEPTIONS.split(',') : [];

// What elements should we not run pa11y on (i.e. google ad iFrames)
// set per-project in PA11Y_HIDE in config-vars
// Use with caution. May break the experience for users.
config.defaults.hideElements = process.env.PA11Y_HIDE ? `${process.env.PA11Y_HIDE},${config.defaults.hideElements}` : config.defaults.hideElements;


/**
 * Headers can be set:
 * - globally for all apps, in builtHeaders here
 * - per app, in PA11Y_HEADERS in config-vars
 * - per test, in smoke.js
 * Headers objects will be merged, cookies will be concatenated
 */

const DEFAULT_COOKIE = 'next-flags=ads:off,sourcepoint:off,cookieMessage:off; secure=true';
let builtHeaders = {};

// per-app headers
if (process.env.PA11Y_HEADERS) {

	builtHeaders = Object.assign({}, builtHeaders, JSON.parse(process.env.PA11Y_HEADERS));

	// concatenate any app-specific cookies
	if (builtHeaders.Cookie) {
		builtHeaders.Cookie = builtHeaders.Cookie + ',' + DEFAULT_COOKIE;
	}
}
else {

	// use the globaly cookies only if nothing app-specific
	builtHeaders = {
		Cookie: DEFAULT_COOKIE
	};
}

config.defaults.page.headers = builtHeaders;

console.log('PA11Y_ROUTE_EXCEPTIONS:', process.env.PA11Y_ROUTE_EXCEPTIONS);
console.log('exceptions:', exceptions);
console.log('PA11Y_ROUTE_HEADERS:', process.env.PA11Y_ROUTE_HEADERS);
console.log('headers:', config.defaults.page.headers);
console.log('PA11Y_HIDE:', process.env.PA11Y_HIDE);
console.log('config.defaults.hideElements:', config.defaults.hideElements);

// Don't console.log headers once backend key is added to the object
config.defaults.page.headers['FT-Next-Backend-Key'] = process.env.FT_NEXT_BACKEND_KEY;


smoke.forEach((smokeConfig) => {
	for (let url in smokeConfig.urls) {

		let isException = false;

		exceptions.forEach((path) => {
			isException = isException || url.indexOf(path) !== -1;
		});

		if (smokeConfig.urls[url] !== 200 || url === '/__health' || isException) {
			continue;
		}

		const thisUrl = {
			url: process.env.TEST_URL + url
		}

		if (process.env.TEST_URL.includes('local')) {
			thisUrl.screenCapture = './pa11y_screenCapture/' + url + '.png';
		}

		// Do we have test-specific headers?
		if (smokeConfig.headers) {
			thisUrl.page = {};

			let fullCookie;

			// concatenate any test-specific cookies
			if (smokeConfig.headers.Cookie) {
				fullCookie = smokeConfig.headers.Cookie + ',' + config.defaults.page.headers.Cookie;
			}

			// Merge the headers header
			thisUrl.page.headers = Object.assign({}, config.defaults.page.headers, smokeConfig.headers);

			// Set the concatenated cookie
			thisUrl.page.headers.Cookie = fullCookie;
		}

		urls.push(thisUrl)
	}
});

for (let viewport of viewports) {
	for (let url of urls) {
		url.viewport = viewport;
		config.urls.push(url);
	}
}

module.exports = config;
