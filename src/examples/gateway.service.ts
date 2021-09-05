import { ServiceBroker } from 'moleculer';
import ApiService from 'moleculer-web';
import gatewayMixin from '../gatewayMixin';

const broker = new ServiceBroker();

broker.createService({ name: 'gateway', mixins: [ApiService, gatewayMixin()] });

broker.start();
