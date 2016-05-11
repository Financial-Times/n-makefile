const path = require('path');
const autoprefixer = require('autoprefixer');
const BowerWebpackPlugin = require('bower-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ExtractCssBlockPlugin = require('extract-css-block-webpack-plugin');
const DefinePlugin = require('webpack').DefinePlugin;
const UglifyJsPlugin = require('webpack').optimize.UglifyJsPlugin;
const config = require('./n-makefile.json');
const packageJson = require('./package.json');
const crypto = require('crypto');
const fs = require('fs');
const readFileSync = fs.readFileSync;
const writeFileSync = fs.writeFileSync;

function hasReact () {
	return packageJson.dependencies.react || packageJson.dependencies['preact-compat'];
}

module.exports = {
	devtool: 'source-map',
	entry: config.assets.entry,
	output: { filename: '[name]' },
	module: {
		loaders: [
			{
				test: /\.js$/,
				loader: require.resolve('babel-loader'),
				include: [
					/bower_components/,
					path.resolve(__dirname, 'client'),
					path.resolve(__dirname, 'config'),
					path.resolve(__dirname, 'shared')
				].concat((config.assets.includes || []).map(path => new RegExp(path))),
				query: {
					cacheDirectory: true,
					presets: (
						hasReact() ?
							[require.resolve('babel-preset-react'), require.resolve('babel-preset-es2015')] :
							[require.resolve('babel-preset-es2015')]
					),
					plugins: [
						require.resolve('babel-plugin-add-module-exports'),
						require.resolve('babel-plugin-transform-runtime'),
						[require.resolve('babel-plugin-transform-es2015-classes'), { loose: true }]
					]
				}
			},
			// force fastclick to load CommonJS
			{
				test: /fastclick\.js$/,
				loader: require.resolve('imports-loader'),
				query: 'define=>false'
			},
			// don't use requireText plugin (use the 'raw' plugin)
			{
				test: /follow-email\.js$/,
				loader: require.resolve('imports-loader'),
				query: 'requireText=>require'
			},
			// set 'this' scope to window
			{
				test: /cssrelpreload\.js$/,
				loader: require.resolve('imports-loader'),
				query: 'this=>window'
			},
			{
				test: /\.scss$/,
				loader: ExtractTextPlugin.extract(process.argv.indexOf('--dev') === -1
					// COMPLEX: Must specify the outputStyle of Sass because if you don't and you use Sass with UglifyJSPlugin
					// even if the test for the UglifyJsPlugin only matches CSS files it will magically switch Sass's outputStyle
					// to compressed ¯\_(ツ)_/¯.
					? `css?minimize&-autoprefixer&sourceMap!postcss-loader!sass?sourceMap&outputStyle=expanded&includePaths[]=${path.resolve(__dirname, './bower_components')}`
					: `css!postcss-loader!sass?includePaths[]=${path.resolve(__dirname, './bower_components')}`
				)
			},
			{
				test: /\.html$/,
				loader: 'raw'
			}
		]
	},
	postcss: function () {
		return [autoprefixer({ browsers: ['> 1%', 'last 2 versions', 'ie > 6', 'ff ESR', 'bb >= 7'] })];
	},
	plugins: (function() {
		const plugins = [
			new BowerWebpackPlugin({ includes: /\.js$/ }),
			new ExtractTextPlugin('[name]', { allChunks: true }),
			new ExtractCssBlockPlugin()
		];

		// Production
		if (process.argv.indexOf('--dev') === -1) {
			plugins.push(new DefinePlugin({ 'process.env': { 'NODE_ENV': '"production"' } }));
			plugins.push(new UglifyJsPlugin({ 'compress': { 'warnings': false } }));
			plugins.push(function() {
				this.plugin('done', stats => {
					const hashable = Object.keys(stats.compilation.assets)
						.filter(asset => !/\.map$/.test(asset))
						.map(fullPath => {
							const name = path.basename(fullPath);
							const file = readFileSync(fullPath, 'utf8');
							const hash = crypto.createHash('sha1').update(file).digest('hex');
							const hashedName = `${hash.substring(0, 8)}/${name}`;
							return {
								name: name,
								hashedName: hashedName
							};
						})
						.reduce((previous, current) => {
							previous[current.name] = current.hashedName;
							previous[current.name + '.map'] = current.hashedName + '.map';
							return previous;
						}, {});
					writeFileSync('./public/asset-hashes.json', JSON.stringify(hashable, undefined, 2), { encoding: 'UTF8' });
				});
			});
		}

		return plugins;
	}()),
	resolve: {
		root: [
			path.join(__dirname, 'bower_components'),
			path.join(__dirname, 'node_modules')
		]
	}
};

if (packageJson.dependencies['preact-compat']) {
	module.exports.resolve.alias = {
		'react': 'preact-compat',
		'react-dom': 'preact-compat'
	}
}
