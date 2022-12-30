const baseConfig = require('@moleculer-graphql/jest-config');

module.exports = {
	...baseConfig,
	coverageThreshold: {}, // temporarily set coverage threshold low while tests are being created
};
