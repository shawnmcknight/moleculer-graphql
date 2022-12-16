import type { BrokerOptions, LogLevels } from 'moleculer';

const brokerOptions: BrokerOptions = {
	logLevel: (process.env.LOGLEVEL as LogLevels | undefined) ?? 'info',
	logger: {
		type: 'Console',
		options: {
			formatter: 'full',
		},
	},
	tracing: { enabled: true, exporter: 'Console' },
};

export default brokerOptions;
