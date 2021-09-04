import type { Service, ServiceSchema, Context } from 'moleculer';
import type { GraphQLRequest } from './GraphQLExecutor';
import GraphQLExecutor from './GraphQLExecutor';
import SchemaBuilder from './SchemaBuilder';

interface ServiceMixinOptions {
	typeDefs: string;
	resolvers?: Record<string, any>;
}

interface GraphQLService extends Service {
	graphQLExecutor: GraphQLExecutor;
}

export default function serviceMixin(opts: ServiceMixinOptions): Partial<ServiceSchema> {
	const { typeDefs, resolvers } = opts;

	return {
		actions: {
			$handleGraphQLRequest(this: GraphQLService, ctx: Context<GraphQLRequest>) {
				return this.graphQLExecutor.execute(ctx);
			},
		},

		events: {
			'$broker.started': {
				handler() {
					const schemaBuilder = new SchemaBuilder(this, typeDefs, { resolvers });

					const schema = schemaBuilder.build();

					this.graphQLExecutor = new GraphQLExecutor(schema);
				},
			},
		},
	};
}
