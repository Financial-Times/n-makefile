console.error(`
n-makefile no longer provides webpack.config.js

Please
- run \`npm install -D @financial-times/n-webpack\`
- delete webpack.config.js from your .gitignore
- save the following in your new webpack.config.js file

NOTE TO DARREN
the clever stuff for lazy-loaded images isn't covered in this
so will still need to be copied across for front page

const nWebpack = require('@financial-times/n-webpack');

const config = require('./n-makefile');

module.exports = nWebpack({
	withHeadCss: true,
	withHashedAssets: true,
	withBabelPolyfills: true,
	entry: config.assets.entry,
	includes: config.assets.includes
});
`);
