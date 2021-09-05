import type { ServerResponse } from 'http';
import type { Service, ServiceSchema } from 'moleculer';
import RequestHandler from './RequestHandler';
import type { Request } from './RequestParser';

interface GatewayService extends Service {
	requestHandler: RequestHandler;
}

export default function gatewayMixin(): Partial<ServiceSchema> {
	return {
		created(this: GatewayService) {
			this.requestHandler = new RequestHandler({ showGraphiQL: true });

			const route = {
				path: '/graphql',
				aliases: {
					'/': (req: Request, res: ServerResponse) => {
						return this.requestHandler.handle(req, res);
					},
				},
			};

			this.settings.routes.unshift(route);
		},
	};
}
