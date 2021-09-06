import type { ServiceBroker } from 'moleculer';
import { Service } from 'moleculer';
import ApiService from 'moleculer-web';
import { gatewayMixin } from '../src';

class GatewayService extends Service {
	public constructor(broker: ServiceBroker) {
		super(broker);

		this.parseServiceSchema({ name: 'gateway', mixins: [ApiService, gatewayMixin()] });
	}
}

export default GatewayService;
