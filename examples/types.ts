import type { GraphQLSchema } from 'graphql';

export interface DirectiveFactoryResult {
	typeDefs: string;
	transformer: (schema: GraphQLSchema) => GraphQLSchema;
}
