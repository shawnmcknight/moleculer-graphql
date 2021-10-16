import type { ServerResponse } from 'http';
import { printSchema } from 'graphql';
import type { ValidationRule } from 'graphql';
import { defaultsDeep } from 'lodash';
import type { Service, ServiceSchema } from 'moleculer';
import type { Route } from 'moleculer-web';
import { GatewayStitcher, RequestHandler } from '../classes';
import type { Request } from '../classes';
import { contextFactory as defaultContextFactory } from '../factories';
import type { GraphQLContextFactory, GraphQLContext } from '../factories';

interface GatewayService extends Service {
	rebuildSchema: boolean;
	gatewayStitcher: GatewayStitcher;
	requestHandler: RequestHandler;
}

export interface GatewayMixinOptions<TGraphQLContext extends GraphQLContext> {
	contextFactory?: GraphQLContextFactory<TGraphQLContext>;
	introspection?: boolean;
	routeOptions?: Route;
	showGraphiQL?: boolean;
	validationRules?: readonly ValidationRule[];
}

export default function gatewayMixin<TGraphQLContext extends GraphQLContext = GraphQLContext>(
	mixinOptions: GatewayMixinOptions<TGraphQLContext> = {},
): Partial<ServiceSchema> {
	const {
		introspection,
		routeOptions,
		validationRules,
		showGraphiQL,
		contextFactory = defaultContextFactory,
	} = mixinOptions;

	return {
		created(this: GatewayService) {
			this.rebuildSchema = true;
			this.gatewayStitcher = new GatewayStitcher(this);

			const route = defaultsDeep(routeOptions, {
				path: '/graphql',
				aliases: {
					'/': (req: Request, res: ServerResponse) => {
						if (this.rebuildSchema) {
							const schema = this.gatewayStitcher.stitch();

							this.requestHandler = new RequestHandler(schema, contextFactory, {
								introspection,
								showGraphiQL,
								validationRules,
							});
							this.rebuildSchema = false;

							this.broker.broadcast('graphql.schema.updated', {
								schema: printSchema(schema),
							});
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
