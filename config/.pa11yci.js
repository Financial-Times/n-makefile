const viewports = process.env.PA11Y_VIEWPORTS || [
	{
		width: 1440,
		height: 1220
	}
];

const smoke = require('./test/smoke.js');

const urls = [];

/**
 * Headers can be set:
 * - globally for all apps, in config.defaults.page.headers here
 * - per test, in smoke.js
 * Headers objects will be merged, cookies and flags will be concatenated
 * No flags allowed inside the cookie for easier merging: use the FT-Flags header instead
 */

const DEFAULT_COOKIE = 'secure=true';
const DEFAULT_FLAGS = 'ads:off,sourcepoint:off,cookieMessage:off';

// Add any global config (inc headers) here
const config = {
	defaults: {
		page: {
			headers: {
				'Cookie': DEFAULT_COOKIE,
				'FT-Flags': DEFAULT_FLAGS
			}
		},
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
			let fullFlags;

			// Merge the headers
			thisUrl.page.headers = Object.assign({}, config.defaults.page.headers, smokeConfig.headers);

			// concatenate any test-specific cookies
			if (smokeConfig.headers.Cookie) {
				console.log('• merging cookies...');

				// Keep flags out of the cookie for easier merging
				if (smokeConfig.headers.Cookie.indexOf('flags') !== -1) {
					throw Error('please don\'t set any flags inside the Cookie. Use the \'FT-Flags\' header');
				}

				// Set the concatenated cookies
				thisUrl.page.headers.Cookie = smokeConfig.headers.Cookie + '; ' + config.defaults.page.headers.Cookie;
			}

			// concatenate any test-specific flags
			if (smokeConfig.headers['FT-Flags']) {
				console.log('• merging flags...');

				// Set the concatenated flags
				thisUrl.page.headers['FT-Flags'] = smokeConfig.headers['FT-Flags'] + ',' + config.defaults.page.headers['FT-Flags'];
			}
		}

		urls.push(thisUrl);
	}
});

for (let viewport of viewports) {
	for (let url of urls) {
		url.viewport = viewport;
		config.urls.push(url);
	}
}

module.exports = config;
