/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				tsconfig: '<rootDir>/tsconfig.test.json',
			},
		],
	},
	testEnvironment: 'node',
	modulePathIgnorePatterns: ['<rootDir>/dist'],
	testMatch: [
		'**/?(*.)+(spec|test).?([cm])[jt]s?(x)',
		'!**/dist/**/*', // ignore dist
	],
	resetMocks: true, // clear history and reset behavior of mocks between each test
	restoreMocks: true, // restore initial behavior of mocked functions
	coverageDirectory: 'coverage',
	collectCoverageFrom: [
		'**/src/**/!(*.spec|*.test).?([cm])[jt]s?(x)', // js, jsx, ts, and tsx files in "src" folder
		'!**/node_modules/**', // not node_modules
		'!**/__mocks__/**', // not jest mocks
		'!**/index.?([cm])[jt]s?(x)', // not index export files
		'!**/*.d.ts', // not ambient declarations
	],
	coverageThreshold: {
		'**/*.?([cm])[jt]s?(x)': {
			statements: 25,
			branches: 25,
			functions: 25,
			lines: 25,
		},
	},
};
