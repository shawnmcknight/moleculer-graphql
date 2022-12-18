import { GraphQLContextCreator, type GraphQLContextFactory } from '@moleculer-graphql/context';
import type { ExecutionResult, GraphQLSchema } from 'graphql';
import { execute, parse, Source } from 'graphql';
import type { Context } from 'moleculer';

interface GraphQLExecutorOptions<TGraphQLContext extends Record<string, unknown>> {
	contextFactory?: GraphQLContextFactory<TGraphQLContext>;
}

class GraphQLExecutor<TGraphQLContext extends Record<string, unknown>> {
	private readonly schema: GraphQLSchema;

	private readonly graphqlContextCreator: GraphQLContextCreator<TGraphQLContext>;

	public constructor(schema: GraphQLSchema, opts: GraphQLExecutorOptions<TGraphQLContext> = {}) {
		const { contextFactory } = opts;

		this.schema = schema;
		this.graphqlContextCreator = new GraphQLContextCreator(contextFactory);
	}

	public async execute(
		ctx: Context,
		query: string,
		variables: Readonly<Record<string, unknown>> | null,
		operationName: string | null,
	): Promise<ExecutionResult> {
		const documentAST = parse(new Source(query, 'GraphQL request'));

		const graphQLContext = await this.graphqlContextCreator.createGraphQLContext(ctx);

		return execute({
			schema: this.schema,
			document: documentAST,
			contextValue: graphQLContext,
			variableValues: variables,
			operationName,
		});
	}
}

export default GraphQLExecutor;
