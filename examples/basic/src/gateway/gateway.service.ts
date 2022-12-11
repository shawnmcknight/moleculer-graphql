import { gatewayMixin } from '@shawnmcknight/moleculer-graphql';
import depthLimit from 'graphql-depth-limit';
import type { ServiceBroker } from 'moleculer';
import { Service } from 'moleculer';
import ApiService from 'moleculer-web';

class GatewayService extends Service {
	public constructor(broker: ServiceBroker) {
		super(broker);

		this.parseServiceSchema({
			name: 'gateway',
			mixins: [ApiService, gatewayMixin({ validationRules: [depthLimit(10)] })],
			dependencies: ['author', 'post'],

			events: {
				'graphql.schema.updated'(schema: string) {
					this.logger.info('GraphQL schema updated:', schema);
				},
			},
		});
	}
}

export default GatewayService;
