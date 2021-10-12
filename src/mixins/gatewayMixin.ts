import type { ServerResponse } from 'http';
import type { Service, ServiceSchema } from 'moleculer';
import { GatewayStitcher, RequestHandler } from '../classes';
import type { Request } from '../classes';
import { defaultsDeep } from 'lodash';

interface GatewayService extends Service {
	rebuildSchema: boolean;
	gatewayStitcher: GatewayStitcher;
	requestHandler: RequestHandler;
}

export interface MixinOptions {
	routeOptions: object | null;
}

export default function gatewayMixin(mixinOptions: MixinOptions): Partial<ServiceSchema> {
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

				mappingPolicy: "restrict",

				bodyParsers: {
					json: true,
					urlencoded: { extended: true },
				},
			});

			this.settings.routes.unshift(route);
		},

		events: {
			'$services.changed'(this: GatewayService) {
				this.rebuildSchema = true;
			},
		},
	};
}
