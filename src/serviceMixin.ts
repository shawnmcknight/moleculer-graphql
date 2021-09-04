import type { Service, ServiceSchema, Context } from 'moleculer';
import type { GraphQLRequest } from './GraphQLExecutor';
import GraphQLExecutor from './GraphQLExecutor';
import SchemaBuilder from './SchemaBuilder';

interface ServiceMixinOptions {
	typeDefs: string;
}

interface GraphQLService extends Service {
	graphQLExecutor: GraphQLExecutor;
}

export default function serviceMixin(
	this: Service,
	opts: ServiceMixinOptions
): Partial<ServiceSchema> {
	const { typeDefs } = opts;

	return {
		actions: {
			handleGraphQLRequest(this: GraphQLService, ctx: Context<GraphQLRequest>) {
				return this.graphQLExecutor.execute(ctx);
			},
		},

		events: {
			'$broker.started': {
				handler(this: Service) {
					const schemaBuilder = new SchemaBuilder(this, typeDefs);

					const schema = schemaBuilder.build();

					this.graphQLExecutor = new GraphQLExecutor(schema);
				},
			},
		},
	};
}
