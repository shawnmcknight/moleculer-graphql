import type { SubschemaConfig } from '@graphql-tools/delegate';
import { stitchSchemas } from '@graphql-tools/stitch';
import type { Executor, ExecutionResult } from '@graphql-tools/utils';
import type { GraphQLSchema } from 'graphql';
import { print, buildSchema } from 'graphql';
import type { Context, Service, ServiceSchema } from 'moleculer';
import type { GraphQLRequest } from './serviceMixin';

class GatewayStitcher {
	private service: Service;

	public constructor(service: Service) {
		this.service = service;
	}

	public stitch(): GraphQLSchema {
		const allServices = this.service.broker.registry.getServiceList({});

		const subschemas = allServices.reduce<SubschemaConfig<unknown, unknown, unknown, Context>[]>(
			(acc, service) => {
				if (service.settings?.$graphql?.typeDefs == null) {
					return acc;
				}

				const schema = buildSchema(service.settings.$graphql.typeDefs);

				const executor = this.makeRemoteExecutor(service);

				acc.push({ schema, executor });

				return acc;
			},
			[]
		);

		if (subschemas.length === 0) {
			throw new Error('No registered GraphQL services');
		}

		return stitchSchemas({ subschemas });
	}

	private makeRemoteExecutor(service: ServiceSchema): Executor<Context> {
		const { name: serviceName, version } = service;

		const prefix = version != null ? `v${version}.` : '';

		const actionName = `${prefix}${serviceName}.$handleGraphQLRequest`;

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

			const result = await context.call<ExecutionResult, GraphQLRequest>(actionName, {
				query,
				// @ts-ignore: TODO
				variables,
				operationName,
			});

			return result;
		};
	}
}

export default GatewayStitcher;
