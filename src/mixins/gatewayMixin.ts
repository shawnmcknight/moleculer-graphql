import type { ServerResponse } from 'http';
import { printSchema } from 'graphql';
import type { ValidationRule } from 'graphql';
import { defaultsDeep } from 'lodash';
import type { Service, ServiceSchema } from 'moleculer';
import type { Route } from 'moleculer-web';
import { GatewayStitcher, RequestHandler } from '../classes';
import type { GraphQLContextFactory, Request } from '../classes';

interface GatewayService<TGraphQLContext extends Record<string, unknown>> extends Service {
	rebuildSchema: boolean;
	gatewayStitcher: GatewayStitcher;
	requestHandler: RequestHandler<TGraphQLContext>;
}

export interface GatewayMixinOptions<TGraphQLContext extends Record<string, unknown>> {
	contextFactory?: GraphQLContextFactory<TGraphQLContext>;
	introspection?: boolean;
	routeOptions?: Route;
	showGraphiQL?: boolean;
	validationRules?: readonly ValidationRule[];
}

export default function gatewayMixin<
	TGraphQLContext extends Record<string, unknown> = Record<never, never>,
>(mixinOptions: GatewayMixinOptions<TGraphQLContext> = {}): Partial<ServiceSchema> {
	const { introspection, routeOptions, validationRules, showGraphiQL, contextFactory } =
		mixinOptions;

	return {
		created(this: GatewayService<TGraphQLContext>) {
			this.rebuildSchema = true;
			this.gatewayStitcher = new GatewayStitcher(this);

			const route = defaultsDeep(routeOptions, {
				path: '/graphql',
				aliases: {
					'/': (req: Request, res: ServerResponse) => {
						if (this.rebuildSchema) {
							const schema = this.gatewayStitcher.stitch();

							this.requestHandler = new RequestHandler(schema, {
								contextFactory,
								introspection,
								showGraphiQL,
								validationRules,
							});
							this.rebuildSchema = false;

							this.broker
								.broadcast('graphql.schema.updated', {
									schema: printSchema(schema),
								})
								.catch((err) => {
									this.logger.error(err);
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
			'$services.changed'(this: GatewayService<TGraphQLContext>) {
				this.rebuildSchema = true;
			},
		},
	};
}
