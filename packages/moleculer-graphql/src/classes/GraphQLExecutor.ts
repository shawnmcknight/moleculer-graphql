import type { ExecutionResult, GraphQLSchema } from 'graphql';
import { execute, parse, Source } from 'graphql';
import type { Context } from 'moleculer';

export type GraphQLContextFactory<TGraphQLContext extends Record<string, unknown>> =
	() => Promise<TGraphQLContext>;

export type GraphQLContext<TGraphQLContext extends Record<string, unknown>> = TGraphQLContext & {
	$ctx: Context;
};

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

		const graphQLContext = await this.createGraphQLContext(ctx);

		return execute({
			schema: this.schema,
			document: documentAST,
			contextValue: graphQLContext,
			variableValues: variables,
			operationName,
		});
	}

	/** Generate the GraphQL Context object */
	private async createGraphQLContext(ctx: Context) {
		return {
			...(await this.contextFactory?.()),
			$ctx: ctx,
		};
	}
}

export default GraphQLExecutor;
