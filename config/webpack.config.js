const path = require('path');
const autoprefixer = require('autoprefixer');
const BowerWebpackPlugin = require('bower-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const DefinePlugin = require('webpack').DefinePlugin;
const UglifyJsPlugin = require('webpack').optimize.UglifyJsPlugin;
const config = require('./n-makefile.json');

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
						require('./package.json').dependencies.react ?
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
				loader: 'imports?define=>false'
			},
			// don't use requireText plugin (use the 'raw' plugin)
			{
				test: /follow-email\.js$/,
				loader: 'imports?requireText=>require'
			},
			{
				test: /\.scss$/,
				loader: ExtractTextPlugin.extract(process.argv.indexOf('--dev') === -1
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
	plugins: function() {
		const plugins = [
			new BowerWebpackPlugin({ includes: /\.js$/ }),
			new ExtractTextPlugin('[name]', { allChunks: true })
		];

		// Production
		if (process.argv.indexOf('--dev') === -1) {
			plugins.push(new DefinePlugin({ 'process.env': { 'NODE_ENV': '"production"' } }));
			if (config.assets.compress !== false) {
				plugins.push(new UglifyJsPlugin());
			}
		}

		return plugins;
	}(),
	resolve: {
		root: [
			path.join(__dirname, 'bower_components'),
			path.join(__dirname, 'node_modules')
		]
	}
};
