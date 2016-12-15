const viewports = [
	{
		width: 1440,
		height: 1220
	},
	{
		width: 1220,
		height: 980
	},
	{
		width: 980,
		height: 740
	},
	{
		width: 740,
		height: 490
	},
	{
		width: 490,
		height: 740
	}
];

const smoke = require('./test/smoke.js');

const urls = [];

const config = {
	defaults: {
		page: {},
		timeout: 50000
	},
	hideElements: 'iframe[src*=google],iframe[src*=proxy]',
	urls: []
}

// Override with project specifics, if any
const exceptions = process.env.PA11Y_ROUTE_EXCEPTIONS ? process.env.PA11Y_ROUTE_EXCEPTIONS.split(',') : [];
config.defaults.page.headers = process.env.PA11Y_HEADERS ? JSON.parse(process.env.PA11Y_HEADERS) : {Cookie: 'next-flags=ads:off,cookieMessage:off; secure=true'};
config.defaults.hideElements = process.env.PA11Y_HIDE ? `${process.env.PA11Y_HIDE},${config.defaults.hideElements}` : config.defaults.hideElements

console.log('config-vars exceptions: ', process.env.PA11Y_ROUTE_EXCEPTIONS, exceptions);
console.log('config-vars headers: ', process.env.PA11Y_HEADERS, config.defaults.page.headers);
console.log('config-vars hidden elements: ', process.env.PA11Y_HIDE, config.defaults.hideElements);

smoke.forEach((smokeConfig) => {
	for (url in smokeConfig.urls) {

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

		if (smokeConfig.headers) {
			thisUrl.headers = smokeConfig.headers
		}

		urls.push(thisUrl)
	}
});

for (viewport of viewports) {
	for (url of urls) {
		url.viewport = viewport;
		url.verifyPage = process.env.PA11Y_VERIFY_PAGE;
		config.urls.push(url);
	}
}

module.exports = config;
