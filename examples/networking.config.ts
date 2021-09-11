import type { BrokerOptions, LogLevels } from 'moleculer';

const brokerOptions: BrokerOptions = {
	transporter: {
		type: 'TCP',
	},
	logLevel: (process.env.LOGLEVEL as LogLevels | undefined) ?? 'debug',
	logger: {
		type: 'Console',
		options: {
			formatter: 'full',
		},
	},
};

export default brokerOptions;
