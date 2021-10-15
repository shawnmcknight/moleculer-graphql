import type { GraphQLSchema, ExecutionResult, ValidationRule } from 'graphql';
import { Source, execute, parse, getOperationAST, specifiedRules, validate } from 'graphql';
import httpError from 'http-errors';
import type { Context } from 'moleculer';

interface ExecuteOptions {
	validationRules?: readonly ValidationRule[];
}

class GraphQLExecutor {
	private schema: GraphQLSchema;

	public constructor(schema: GraphQLSchema) {
		this.schema = schema;
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

		const validationErrors = validate(this.schema, documentAST, [
			...validationRules,
			...specifiedRules,
		]);

		if (validationErrors.length > 0) {
			// Return 400: Bad Request if any validation errors exist.
			throw httpError(400, 'GraphQL validation error.', {
				graphqlErrors: validationErrors,
			});
		}

		const result = await execute({
			schema: this.schema,
			document: documentAST,
			contextValue: ctx,
			variableValues: variables,
			operationName,
		});

		return result;
	}
}

export default GraphQLExecutor;
