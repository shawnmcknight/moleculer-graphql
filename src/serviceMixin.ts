import type { Service, ServiceSchema, Context } from 'moleculer';
import GraphQLExecutor from './GraphQLExecutor';
import SchemaBuilder from './SchemaBuilder';

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
	schemaBuilder: SchemaBuilder;
}

export interface GraphQLRequest {
	query: string;
	variables: Readonly<Record<string, unknown>> | null;
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
		},

		events: {
			'$broker.started': {
				handler(this: GraphQLService) {
					this.schemaBuilder = new SchemaBuilder(this, typeDefs, { resolvers });

					const schema = this.schemaBuilder.build();

					this.settings.$graphql = {
						typeDefs: this.schemaBuilder.getTypeDefs(),
					};

					this.graphQLExecutor = new GraphQLExecutor(schema);
				},
			},
		},
	};
}
