import type { SubschemaConfig } from '@graphql-tools/delegate';
import type { IResolvers } from '@graphql-tools/utils';
import { defaultsDeep } from 'lodash';
import type { Service, ServiceSchema, Context } from 'moleculer';
import { GraphQLExecutor, SchemaBuilder } from '../classes';
import { contextFactory as defaultContextFactory } from '../factories';
import type { GraphQLContextFactory, GraphQLContext } from '../factories';

type SubschemaConfigOmittedProps = 'schema' | 'executor';
type ServiceMixinSubschemaConfig = Omit<SubschemaConfig, SubschemaConfigOmittedProps>;

interface ServiceMixinOptions<TGraphQLContext extends GraphQLContext> {
	typeDefs: string;
	contextFactory?: GraphQLContextFactory<TGraphQLContext>;
	resolvers?: IResolvers<unknown, TGraphQLContext>;
	subschemaConfig?: ServiceMixinSubschemaConfig;
}

interface GraphQLSettings {
	typeDefs: string;
	subschemaConfig: ServiceMixinSubschemaConfig;
}
export interface GraphQLServiceSettings {
	$graphql: GraphQLSettings;
}

interface GraphQLService extends Service<GraphQLServiceSettings> {
	graphQLExecutor: GraphQLExecutor;
}

export interface GraphQLRequest {
	query: string;
	variables: Readonly<Record<string, unknown>> | null;
	operationName: string | null;
}

export default function serviceMixin<TGraphQLContext extends GraphQLContext = GraphQLContext>(
	opts: ServiceMixinOptions<TGraphQLContext>,
): Partial<ServiceSchema> {
	const { typeDefs, resolvers, subschemaConfig, contextFactory = defaultContextFactory } = opts;

	const defaultedSubschemaConfig: ServiceMixinSubschemaConfig = defaultsDeep({}, subschemaConfig, {
		batch: true,
	});

	return {
		created(this: GraphQLService) {
			const schemaBuilder = new SchemaBuilder(this, typeDefs, { resolvers });

			const schema = schemaBuilder.build();

			this.settings.$graphql = {
				typeDefs: schemaBuilder.getTypeDefs(),
				subschemaConfig: defaultedSubschemaConfig,
			};

			this.graphQLExecutor = new GraphQLExecutor(schema);
		},

		actions: {
			async $handleGraphQLRequest(this: GraphQLService, ctx: Context<GraphQLRequest>) {
				const { query, variables, operationName } = ctx.params;

				const graphQLContext = await contextFactory(ctx);

				return this.graphQLExecutor.execute(graphQLContext, query, variables, operationName);
			},
		},
	};
}
