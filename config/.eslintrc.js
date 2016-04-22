const config = {
	'env': {
		'browser': true,
		'es6': true,
		'mocha': true,
		'node': true
	},
	'parserOptions': {
		'sourceType': 'module'
	},
	'rules': {
		'no-unused-vars': 2,
		'no-undef': 2,
		'eqeqeq': 2,
		'no-underscore-dangle': 0,
		'guard-for-in': 2,
		'no-extend-native': 2,
		'wrap-iife': 2,
		'new-cap': 2,
		'no-caller': 2,
		'quotes': [1, 'single'],
		'no-loop-func': 2,
		'no-irregular-whitespace': 1,
		'no-multi-spaces': 2,
		'one-var': [2, 'never'],
		'no-var': 1,
		'space-before-function-paren': [1, 'always'],
		'strict': [1, 'global'],
		'no-console': 1
	},
	'globals': {
		'fetch': true,
		'requireText': true
	},
	'plugins': [],
	'extends': []
};

const packageJson = require('./package.json');

if (packageJson.dependencies && packageJson.dependencies.react) {
	config.plugins.push('react');
	config.extends.push('plugin:react/recommended');

	Object.assign(config.rules, {
		'react/display-name': 0,
		'react/prop-types': 0,
		'react/no-danger': 0
	});
}

module.exports = config;
