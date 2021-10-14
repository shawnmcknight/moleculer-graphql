import type { ServerResponse } from 'http';
import { defaultsDeep } from 'lodash';
import type { Service, ServiceSchema } from 'moleculer';
import type { Route } from 'moleculer-web';
import { GatewayStitcher, RequestHandler } from '../classes';
import type { Request } from '../classes';

interface GatewayService extends Service {
	rebuildSchema: boolean;
	gatewayStitcher: GatewayStitcher;
	requestHandler: RequestHandler;
}

export interface MixinOptions {
	routeOptions?: Route;
}

export default function gatewayMixin(mixinOptions: MixinOptions = {}): Partial<ServiceSchema> {
	return {
		created(this: GatewayService) {
			this.rebuildSchema = true;
			this.gatewayStitcher = new GatewayStitcher(this);

			const route = defaultsDeep(mixinOptions.routeOptions, {
				path: '/graphql',
				aliases: {
					'/': (req: Request, res: ServerResponse) => {
						if (this.rebuildSchema) {
							const schema = this.gatewayStitcher.stitch();

							this.requestHandler = new RequestHandler(schema, { showGraphiQL: true });
							this.rebuildSchema = false;
						}

						return this.requestHandler.handle(req, res);
					},
				},

				mappingPolicy: 'restrict',

				bodyParsers: false,
			}) as Route;

			this.settings.routes.unshift(route);
		},

		events: {
			'$services.changed'(this: GatewayService) {
				this.rebuildSchema = true;
			},
		},
	};
}
