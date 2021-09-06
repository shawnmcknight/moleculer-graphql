import type { ServerResponse } from 'http';
import type { Service, ServiceSchema } from 'moleculer';
import GatewayStitcher from '../GatewayStitcher';
import RequestHandler from '../RequestHandler';
import type { Request } from '../RequestHandler';

interface GatewayService extends Service {
	rebuildSchema: boolean;
	gatewayStitcher: GatewayStitcher;
	requestHandler: RequestHandler;
}

export default function gatewayMixin(): Partial<ServiceSchema> {
	return {
		created(this: GatewayService) {
			this.rebuildSchema = true;
			this.gatewayStitcher = new GatewayStitcher(this);

			const route = {
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
			};

			this.settings.routes.unshift(route);
		},

		events: {
			'$services.changed'(this: GatewayService) {
				this.rebuildSchema = true;
			},
		},
	};
}
