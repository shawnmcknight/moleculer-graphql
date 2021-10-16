import type { GraphQLSchema, ExecutionResult, ValidationRule } from 'graphql';
import { Source, execute, parse, getOperationAST, validate } from 'graphql';
import httpError from 'http-errors';
import type { Context } from 'moleculer';
import type { GraphQLContext, GraphQLContextFactory } from '../factories';

interface ExecuteOptions {
	validationRules?: readonly ValidationRule[];
}

class GraphQLExecutor<TGraphQLContext extends GraphQLContext = GraphQLContext> {
	private schema: GraphQLSchema;

	private contextFactory: GraphQLContextFactory<TGraphQLContext>;

	public constructor(
		schema: GraphQLSchema,
		contextFactory: GraphQLContextFactory<TGraphQLContext>,
	) {
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
		const operationAST = getOperationAST(documentAST, operationName);

		const validationErrors = validate(this.schema, documentAST, validationRules);

		if (validationErrors.length > 0) {
			// Return 400: Bad Request if any validation errors exist.
			throw httpError(400, 'GraphQL validation error.', {
				graphqlErrors: validationErrors,
			});
		}

		const graphQLContext = await this.contextFactory(ctx);

		const result = await execute({
			schema: this.schema,
			document: documentAST,
			contextValue: graphQLContext,
			variableValues: variables,
			operationName,
		});

		return result;
	}
}

export default GraphQLExecutor;
