import type { BrokerOptions } from 'moleculer';

const brokerOptions: BrokerOptions = {
	logLevel: 'debug',
	logger: {
		type: 'Console',
		options: {
			formatter: 'full',
		},
	},
};

export default brokerOptions;
