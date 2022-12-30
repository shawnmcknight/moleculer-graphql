import baseConfig from '@moleculer-graphql/jest-config';

// temporarily set coverage threshold low while tests are being created
const { coverageThreshold, ...restConfig } = baseConfig;

export default restConfig;
