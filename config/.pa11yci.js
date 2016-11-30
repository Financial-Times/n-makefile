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

smoke.forEach((config) => {
	for (url in config.urls) {

		// Fragments and components, not real pages
		const exception = url.indexOf('fragment=true') !== -1 || url.indexOf('embedded-components') !== -1 || url.indexOf('story-package') !== -1 || url.indexOf('count=') !== -1;

		if (config.urls[url] !== 200 || url === '/__health' || exception) {
			continue;
		}

		const thisUrl = {
			url: process.env.TEST_URL + url
		}

		if (config.headers) {
			thisUrl.headers = config.headers
		}

		urls.push(thisUrl)
	}
});


const config = {
	defaults: {
		page: {
			headers: {
				"Cookie": "next-flags=ads:off,cookieMessage:off; secure=true"
			}
		},
		timeout: 50000
	},
	urls: []
}

for (viewport of viewports) {
	for (url of urls) {
		url.viewport = viewport;
		config.urls.push(url);
	}
}

module.exports = config;
