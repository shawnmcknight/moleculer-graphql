module.exports = {
	printWidth: 100,
	tabWidth: 2,
	useTabs: false,
	semi: true,
	singleQuote: true,
	trailingComma: 'all',
	bracketSpacing: true,
	bracketSameLine: false,
	arrowParens: 'always',
	overrides: [
		{
			files: ['*.{js,jsx,ts,tsx,d.ts,css,html,graphql}'],
			options: {
				useTabs: true,
			},
		},
	],
};
