import type { SubschemaConfig } from '@graphql-tools/delegate';
import type { SubschemaConfigTransform } from '@graphql-tools/stitch';
import { stitchSchemas } from '@graphql-tools/stitch';
import { stitchingDirectives } from '@graphql-tools/stitching-directives';
import type { ExecutionResult, Executor } from '@graphql-tools/utils';
import type { GraphQLSchema } from 'graphql';
import { buildSchema, print } from 'graphql';
import type { Service, ServiceSchema, ServiceSettingSchema } from 'moleculer';
import type { GraphQLContext } from '../functions';
import type { GraphQLRequest, GraphQLServiceSettings } from '../mixins/serviceMixin';
import { buildFullActionName } from '../utils';

class GatewayStitcher {
	private readonly service: Service;

	public constructor(service: Service) {
		this.service = service;
	}

	public stitch<TGraphQLContext extends Record<string, unknown>>(): GraphQLSchema {
		const allServices = this.service.broker.registry.getServiceList({});

		const processedServiceNames = new Set<string>();

		const subschemas = allServices.reduce<
			SubschemaConfig<unknown, unknown, unknown, GraphQLContext<TGraphQLContext>>[]
		>((acc, service) => {
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

			const executor = this.makeRemoteExecutor<TGraphQLContext>(service);

			acc.push({ ...subschemaConfig, schema, executor });

			return acc;
		}, []);

		if (subschemas.length === 0) {
			throw new Error('No registered GraphQL services');
		}

		const stitchingDirectivesTransformer = stitchingDirectives()
			.stitchingDirectivesTransformer as unknown as SubschemaConfigTransform<
			GraphQLContext<TGraphQLContext>
		>;

		return stitchSchemas<GraphQLContext<TGraphQLContext>>({
			subschemaConfigTransforms: [stitchingDirectivesTransformer],
			subschemas,
		});
	}

	private makeRemoteExecutor<TGraphQLContext extends Record<string, unknown>>(
		serviceSchema: ServiceSchema,
	): Executor<GraphQLContext<TGraphQLContext>> {
		const { name: serviceName, version } = serviceSchema;

		const actionName = buildFullActionName(serviceName, '$handleGraphQLRequest', version);

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
