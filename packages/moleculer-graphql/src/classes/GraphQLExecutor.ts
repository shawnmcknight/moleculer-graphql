import type { ExecutionResult, GraphQLSchema } from 'graphql';
import { execute, parse, Source } from 'graphql';
import type { Context } from 'moleculer';
import type { GraphQLContextFactory } from '../functions';
import { createGraphQLContext } from '../functions';

interface GraphQLExecutorOptions<TGraphQLContext extends Record<string, unknown>> {
	contextFactory?: GraphQLContextFactory<TGraphQLContext>;
}

class GraphQLExecutor<TGraphQLContext extends Record<string, unknown>> {
	private schema: GraphQLSchema;

	private contextFactory?: GraphQLContextFactory<TGraphQLContext>;

	public constructor(schema: GraphQLSchema, opts: GraphQLExecutorOptions<TGraphQLContext> = {}) {
		const { contextFactory } = opts;

		this.schema = schema;
		this.contextFactory = contextFactory;
	}

	public async execute(
		ctx: Context,
		query: string,
		variables: Readonly<Record<string, unknown>> | null,
		operationName: string | null,
	): Promise<ExecutionResult> {
		const documentAST = parse(new Source(query, 'GraphQL request'));

		const graphQLContext =
			this.contextFactory != null
				? await createGraphQLContext(ctx, this.contextFactory)
				: await createGraphQLContext(ctx);

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
