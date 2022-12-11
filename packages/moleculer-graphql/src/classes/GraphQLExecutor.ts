import type { ExecutionResult, GraphQLSchema, ValidationRule } from 'graphql';
import { execute, parse, Source, validate } from 'graphql';
import httpError from 'http-errors';
import type { Context } from 'moleculer';

export type GraphQLContextFactory<TGraphQLContext extends Record<string, unknown>> =
	() => Promise<TGraphQLContext>;

export type GraphQLContext<TGraphQLContext extends Record<string, unknown>> = TGraphQLContext & {
	$ctx: Context;
};

interface GraphQLExecutorOptions<TGraphQLContext extends Record<string, unknown>> {
	contextFactory?: GraphQLContextFactory<TGraphQLContext>;
}

interface ExecuteOptions {
	validationRules?: readonly ValidationRule[];
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
		opts: ExecuteOptions = {},
	): Promise<ExecutionResult> {
		const { validationRules = [] } = opts;

		const documentAST = parse(new Source(query, 'GraphQL request'));

		const validationErrors = validate(this.schema, documentAST, validationRules);

		if (validationErrors.length > 0) {
			// Return 400: Bad Request if any validation errors exist.
			throw httpError(400, 'GraphQL validation error.', {
				graphqlErrors: validationErrors,
			});
		}

		const graphQLContext = await this.createGraphQLContext(ctx);

		const result = await execute({
			schema: this.schema,
			document: documentAST,
			contextValue: graphQLContext,
			variableValues: variables,
			operationName,
		});

		return result;
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
