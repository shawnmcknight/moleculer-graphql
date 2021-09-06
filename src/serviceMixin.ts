import type { Service, ServiceSchema, Context } from 'moleculer';
import GraphQLExecutor from './GraphQLExecutor';
import SchemaBuilder from './SchemaBuilder';

interface ServiceMixinOptions {
	typeDefs: string;
	resolvers?: Record<string, unknown>;
}

interface GraphQLService extends Service {
	graphQLExecutor: GraphQLExecutor;
	schemaBuilder: SchemaBuilder;
}

export interface GraphQLRequest {
	query: string;
	variables: Readonly<Record<string, unknown>>;
	operationName: string | null;
}

export default function serviceMixin(opts: ServiceMixinOptions): Partial<ServiceSchema> {
	const { typeDefs, resolvers } = opts;

	return {
		actions: {
			$handleGraphQLRequest(this: GraphQLService, ctx: Context<GraphQLRequest>) {
				const { query, variables, operationName } = ctx.params;
				return this.graphQLExecutor.execute(ctx, query, variables, operationName);
			},
			$resolveTypeDefs(this: GraphQLService) {
				return this.schemaBuilder.getTypeDefs();
			},
		},

		events: {
			'$broker.started': {
				handler() {
					this.schemaBuilder = new SchemaBuilder(this, typeDefs, { resolvers });

					const schema = this.schemaBuilder.build();

					this.graphQLExecutor = new GraphQLExecutor(schema);
				},
			},
		},
	};
}
