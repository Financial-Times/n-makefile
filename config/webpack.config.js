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

module.exports = {
	devtool: 'source-map',
	entry: config.assets.entry,
	output: { filename: '[name]' },
	module: {
		loaders: [
			{
				test: /\.js$/,
				loader: 'babel',
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
						hasReact() ? [ 'react', 'es2015' ] : [ 'es2015' ]
					),
					plugins: [
						'add-module-exports',
						'transform-runtime',
						[ 'transform-es2015-classes', { loose: true } ]
					]
				}
			},
			// force fastclick to load CommonJS
			{
				test: /fastclick\.js$/,
				loader: 'imports?define=>false'
			},
			// don't use requireText plugin (use the 'raw' plugin)
			{
				test: /follow-email\.js$/,
				loader: 'imports?requireText=>require'
			},
			// set 'this' scope to window
			{
				test: /cssrelpreload\.js$/,
				loader: 'imports?this=>window'
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
		includePaths: [ path.resolve('./bower_components') ]
	},
	postcss: () => {
		return [ autoprefixer({ browsers: ['> 1%', 'last 2 versions', 'ie >= 8', 'ff ESR', 'bb >= 7'] }) ];
	},
	plugins: (() => {
		const plugins = [
			new BowerWebpackPlugin({ includes: /\.js$/ }),
			new ExtractTextPlugin('[name]'),
			new ExtractCssBlockPlugin()
		];

		if (process.argv.indexOf('--dev') === -1) {
			plugins.push(new webpack.DefinePlugin({ 'process.env': { 'NODE_ENV': '"production"' } }));
			plugins.push(new webpack.optimize.UglifyJsPlugin({ 'compress': { 'warnings': false } }));
			plugins.push(new AssetHashesPlugin());
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
