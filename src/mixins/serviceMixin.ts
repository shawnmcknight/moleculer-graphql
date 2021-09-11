import type { SubschemaConfig } from '@graphql-tools/delegate';
import type { IResolvers } from '@graphql-tools/utils';
import { defaultsDeep } from 'lodash';
import type { Service, ServiceSchema, Context } from 'moleculer';
import { GraphQLExecutor, SchemaBuilder } from '../classes';

type SubschemaConfigOmittedProps = 'schema' | 'executor';
type ServiceMixinSubschemaConfig = Omit<SubschemaConfig, SubschemaConfigOmittedProps>;

interface ServiceMixinOptions {
	typeDefs: string;
	resolvers?: IResolvers<unknown, Context>;
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

export default function serviceMixin(opts: ServiceMixinOptions): Partial<ServiceSchema> {
	const { typeDefs, resolvers, subschemaConfig } = opts;

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
			$handleGraphQLRequest(this: GraphQLService, ctx: Context<GraphQLRequest>) {
				const { query, variables, operationName } = ctx.params;
				return this.graphQLExecutor.execute(ctx, query, variables, operationName);
			},
		},
	};
}
