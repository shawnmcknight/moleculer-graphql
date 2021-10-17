import type { SubschemaConfig } from '@graphql-tools/delegate';
import type { IResolvers } from '@graphql-tools/utils';
import { defaultsDeep } from 'lodash';
import type { Service, ServiceSchema, Context } from 'moleculer';
import type { GraphQLContextFactory, GraphQLContext } from '../classes';
import { GraphQLExecutor, SchemaBuilder } from '../classes';

type SubschemaConfigOmittedProps = 'schema' | 'executor';
type ServiceMixinSubschemaConfig = Omit<SubschemaConfig, SubschemaConfigOmittedProps>;

interface ServiceMixinOptions<TGraphQLContext extends Record<string, unknown>> {
	typeDefs: string;
	contextFactory?: GraphQLContextFactory<TGraphQLContext>;
	resolvers?: IResolvers<unknown, GraphQLContext<TGraphQLContext>>;
	subschemaConfig?: ServiceMixinSubschemaConfig;
}

interface GraphQLSettings {
	typeDefs: string;
	subschemaConfig: ServiceMixinSubschemaConfig;
}
export interface GraphQLServiceSettings {
	$graphql: GraphQLSettings;
}

interface GraphQLService<TGraphQLContext extends Record<string, unknown>>
	extends Service<GraphQLServiceSettings> {
	graphQLExecutor: GraphQLExecutor<TGraphQLContext>;
}

export interface GraphQLRequest {
	query: string;
	variables: Readonly<Record<string, unknown>> | null;
	operationName: string | null;
}

export default function serviceMixin<
	TGraphQLContext extends Record<string, unknown> = Record<never, never>,
>(opts: ServiceMixinOptions<TGraphQLContext>): Partial<ServiceSchema> {
	const { typeDefs, resolvers, subschemaConfig, contextFactory } = opts;

	const defaultedSubschemaConfig: ServiceMixinSubschemaConfig = defaultsDeep({}, subschemaConfig, {
		batch: true,
	});

	return {
		created(this: GraphQLService<TGraphQLContext>) {
			const schemaBuilder = new SchemaBuilder(this, typeDefs, { resolvers });

			const schema = schemaBuilder.build();

			this.settings.$graphql = {
				typeDefs: schemaBuilder.getTypeDefs(),
				subschemaConfig: defaultedSubschemaConfig,
			};

			this.graphQLExecutor = new GraphQLExecutor(schema, { contextFactory });
		},

		actions: {
			async $handleGraphQLRequest(
				this: GraphQLService<TGraphQLContext>,
				ctx: Context<GraphQLRequest>,
			) {
				const { query, variables, operationName } = ctx.params;

				return this.graphQLExecutor.execute(ctx, query, variables, operationName);
			},
		},
	};
}
