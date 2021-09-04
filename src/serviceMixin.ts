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
	schemaBuilder: SchemaBuilder;
}

export default function serviceMixin(opts: ServiceMixinOptions): Partial<ServiceSchema> {
	const { typeDefs, resolvers } = opts;

	return {
		actions: {
			$handleGraphQLRequest(this: GraphQLService, ctx: Context<GraphQLRequest>) {
				return this.graphQLExecutor.execute(ctx);
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
