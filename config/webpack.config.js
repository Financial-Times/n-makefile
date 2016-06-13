'use strict';

const config = require('./n-makefile.json');
const packageJson = require('./package.json');
const path = require('path');
const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const BowerWebpackPlugin = require('bower-webpack-plugin');
const ExtractCssBlockPlugin = require('extract-css-block-webpack-plugin');

function hasReact () {
	return packageJson.dependencies.react || packageJson.dependencies['preact-compat'];
}

function AssetHashesPlugin() {
	const fs = require('fs');
	const crypto = require('crypto');

	return function () {
		this.plugin('done', stats => {
			const hashable = Object.keys(stats.compilation.assets)
				.filter(asset => !/\.map$/.test(asset))
				.map(fullPath => {
					const name = path.basename(fullPath);
					const file = fs.readFileSync(fullPath, 'utf8');
					const hash = crypto.createHash('sha1').update(file).digest('hex');
					const hashedName = `${hash.substring(0, 8)}/${name}`;

					return { name, hashedName };
				})
				.reduce((previous, current) => {
					previous[current.name] = current.hashedName;
					previous[current.name + '.map'] = current.hashedName + '.map';
					return previous;
				}, {});

			fs.writeFileSync('./public/asset-hashes.json', JSON.stringify(hashable, undefined, 2), { encoding: 'UTF8' });
		});
	};
}

/**
 * NOTE: need to use `require.resolve` due to a bug in babel that breaks when linking modules
 */
const configBase = {
	devtool: 'source-map',
	output: (() => {
		return config.output || {filename: '[name]'};
	})(),
	externals: config.externals || null,
	module: {
		loaders: [
			{
				test: /\.js$/,
				loader: require.resolve('babel-loader'),
				include: (() => {
					const includes = [
						/bower_components/,
						path.resolve('./client'),
						path.resolve('./config'),
						path.resolve('./shared')
					];

					if (config.assets.includes) {
						config.assets.includes.forEach(
							path => includes.push(new RegExp(path))
						);
					}

					return includes;
				})(),
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
				loader: ExtractTextPlugin.extract(
					process.argv.indexOf('--dev') === -1
						? [ 'css?minimize&-autoprefixer&sourceMap', 'postcss', 'sass' ]
						: [ 'css?sourceMap', 'postcss', 'sass' ]
				)
			},
			{
				test: /\.html$/,
				loader: 'raw'
			}
		]
	},
	sassLoader: {
		sourcemap: true,
		includePaths: [ path.resolve('./bower_components') ],
		// NOTE: This line is important for preservation of comments needed by the css-extract-block plugin
		outputStyle: 'expanded'
	},
	postcss: () => {
		return [ autoprefixer({
			browsers: ['> 1%', 'last 2 versions', 'ie >= 8', 'ff ESR', 'bb >= 7', 'iOS >= 5'],
			flexbox: 'no-2009'
		}) ];
	},
	plugins: (() => {
		const plugins = [
			new BowerWebpackPlugin({ includes: /\.js$/, modulesDirectories: path.resolve('./bower_components') }),
			new ExtractTextPlugin('[name]'),
			new ExtractCssBlockPlugin({ match: /main\.css$/ })
		];

		if (process.argv.indexOf('--dev') === -1) {
			plugins.push(new webpack.DefinePlugin({ 'process.env': { 'NODE_ENV': '"production"' } }));
			plugins.push(new webpack.optimize.UglifyJsPlugin({ 'compress': { 'warnings': false } }));
			if (!config.plugins || config.plugins.hashedAssets !== false) {
				plugins.push(new AssetHashesPlugin());
			}
		}

		return plugins;
	})(),
	resolve: {
		root: [
			path.resolve('./bower_components'),
			path.resolve('./node_modules')
		],
		alias: (() => {
			if (packageJson.dependencies['preact-compat']) {
				return {
					'react': 'preact-compat',
					'react-dom': 'preact-compat'
				};
			}
		})()
	}
};

const enhancedEntryPoints = Object.assign({}, config.assets.entry);
delete enhancedEntryPoints['./public/main-core.js'];
const configs = [Object.assign({}, configBase, { entry: enhancedEntryPoints })];

// if there's a `main-core.js` entry, create config for 'core' browsers
// NOTE: bit hard-coded this. when the assets names/locations settle down, maybe make n-makefile.json not as explicit,
// e.g. `css: ['main', 'ie8'], js: ['enhanced', 'core']
const coreJsOutput = './public/main-core.js';
const coreJsEntryPoint = config.assets.entry[coreJsOutput];
if (coreJsEntryPoint) {
	const coreLoaders = configBase.module.loaders.slice();
	coreLoaders.unshift({
		test: /\.js$/,
		loader: require.resolve('es3ify-loader')
	});
	configs.push(Object.assign({}, configBase, {
		entry: { [coreJsOutput]: coreJsEntryPoint },
		module: { loaders: coreLoaders }
	}));
}

module.exports = configs;
