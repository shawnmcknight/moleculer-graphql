module.exports = {
	env: {
		node: true,
		es2021: true,
	},
	overrides: [
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
		},
		{
			files: '*.js',
			extends: ['eslint:recommended', 'airbnb-base', 'plugin:prettier/recommended'],
			parserOptions: {
				ecmaVersion: 12,
				sourceType: 'module',
			},
		},
	],
};
