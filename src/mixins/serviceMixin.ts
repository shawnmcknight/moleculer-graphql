import type { Service, ServiceSchema, Context } from 'moleculer';
import GraphQLExecutor from '../GraphQLExecutor';
import SchemaBuilder from '../SchemaBuilder';

interface ServiceMixinOptions {
	typeDefs: string;
	resolvers?: Record<string, unknown>;
}

interface GraphQLSettings {
	typeDefs: string;
}
interface GraphQLServiceSettings {
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
	const { typeDefs, resolvers } = opts;

	return {
		created(this: GraphQLService) {
			const schemaBuilder = new SchemaBuilder(this, typeDefs, { resolvers });

			const schema = schemaBuilder.build();

			this.settings.$graphql = {
				typeDefs: schemaBuilder.getTypeDefs(),
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
