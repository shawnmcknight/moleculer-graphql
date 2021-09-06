module.exports = {
	env: {
		node: true,
		es2021: true,
	},
	overrides: [
		{
			files: '*.js',
			extends: ['eslint:recommended', 'airbnb-base', 'plugin:prettier/recommended'],
			parserOptions: {
				ecmaVersion: 12,
				sourceType: 'module',
			},
		},
		{
			files: '*.graphql',
			parser: '@graphql-eslint/eslint-plugin',
			plugins: ['@graphql-eslint'],
			rules: { 'prettier/prettier': ['error', { parser: 'graphql' }] },
		},
		{
			files: '*.ts',
			extends: [
				'eslint:recommended',
				'airbnb-base',
				'airbnb-typescript/base',
				'plugin:@typescript-eslint/recommended',
				'plugin:prettier/recommended',
			],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				project: './tsconfig.json',
			},
			plugins: ['@typescript-eslint'],
			rules: {
				'class-methods-use-this': 'off',
				curly: ['error', 'all'],
				'import/order': ['error', { alphabetize: { order: 'asc' } }],
				'@typescript-eslint/array-type': 'error',
				'@typescript-eslint/ban-ts-comment': [
					'error',
					{
						'ts-expect-error': 'allow-with-description',
						'ts-ignore': 'allow-with-description',
						'ts-nocheck': true,
						'ts-check': false,
					},
				],
				'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
				'@typescript-eslint/explicit-member-accessibility': 'error',
				'@typescript-eslint/member-ordering': 'error',
				'@typescript-eslint/no-parameter-properties': 'error',
			},
		},
		{
			files: 'index.ts',
			rules: {
				'import/prefer-default-export': 'off',
				'import/no-default-export': 'error',
			},
		},
		{
			files: '**/examples/**',
			rules: {
				'import/no-extraneous-dependencies': ['error', { optionalDependencies: false }],
			},
		},
		{
			files: '*.d.ts',
			rules: {
				'max-classes-per-file': 'off',
				'@typescript-eslint/explicit-member-accessibility': 'off',
				'@typescript-eslint/lines-between-class-members': 'off',
			},
		},
	],
};
