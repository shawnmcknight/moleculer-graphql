import type { SubschemaConfig } from '@graphql-tools/delegate';
import { stitchSchemas } from '@graphql-tools/stitch';
import { stitchingDirectives } from '@graphql-tools/stitching-directives';
import type { Executor, ExecutionResult } from '@graphql-tools/utils';
import type { GraphQLSchema } from 'graphql';
import { print, buildSchema } from 'graphql';
import type { Context, Service, ServiceSchema, ServiceSettingSchema } from 'moleculer';
import type { GraphQLContext } from 'src/factories';
import type { GraphQLRequest, GraphQLServiceSettings } from '../mixins/serviceMixin';
import { buildFullActionName } from '../utils';

class GatewayStitcher {
	private service: Service;

	public constructor(service: Service) {
		this.service = service;
	}

	public stitch(): GraphQLSchema {
		const allServices = this.service.broker.registry.getServiceList({});

		const processedServiceNames = new Set<string>();

		const subschemas = allServices.reduce<SubschemaConfig<unknown, unknown, unknown, Context>[]>(
			(acc, service) => {
				const { name: serviceName, settings: serviceSettings } = service;

				if (processedServiceNames.has(serviceName)) {
					return acc;
				}

				processedServiceNames.add(serviceName);

				if (!this.isGraphQLServiceSettings(serviceSettings)) {
					return acc;
				}

				const { typeDefs, subschemaConfig } = serviceSettings.$graphql;

				const schema = buildSchema(typeDefs);

				const executor = this.makeRemoteExecutor(service);

				acc.push({ ...subschemaConfig, schema, executor });

				return acc;
			},
			[],
		);

		if (subschemas.length === 0) {
			throw new Error('No registered GraphQL services');
		}

		const { stitchingDirectivesTransformer } = stitchingDirectives();

		return stitchSchemas({
			// @ts-ignore: TODO
			subschemaConfigTransforms: [stitchingDirectivesTransformer],
			subschemas,
		});
	}

	private makeRemoteExecutor<TGraphQLContext extends GraphQLContext>(
		serviceSchema: ServiceSchema,
	): Executor<TGraphQLContext> {
		const { name: serviceName, version } = serviceSchema;

		const actionName = buildFullActionName(serviceName, '$handleGraphQLRequest', version);

		// @ts-ignore: TODO
		return async ({
			context,
			document,
			variables = null,
			operationName = null,
		}): Promise<ExecutionResult> => {
			if (context == null) {
				throw new Error();
			}

			const query = typeof document === 'string' ? document : print(document);

			const result = await context.$ctx.call<ExecutionResult, GraphQLRequest>(actionName, {
				query,
				// @ts-ignore: TODO
				variables,
				operationName,
			});

			return result;
		};
	}

	private isGraphQLServiceSettings(
		settings?: ServiceSettingSchema,
	): settings is GraphQLServiceSettings {
		return settings?.$graphql != null;
	}
}

export default GatewayStitcher;
