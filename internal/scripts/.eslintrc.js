module.exports = {
	extends: ['@moleculer-graphql/eslint-config'],
	rules: {
		// allow console in scripts
		'no-console': 'off',

		// allow dev dependencies in scripts
		'import/no-extraneous-dependencies': [
			'error',
			{ devDependencies: true, optionalDependencies: false, peerDependencies: false },
		],
	},
};
