import type { GraphQLSchema, ExecutionResult } from 'graphql';
import { Source, execute, parse, getOperationAST } from 'graphql';
import type { Context } from 'moleculer';

class GraphQLExecutor {
	private schema: GraphQLSchema;

	public constructor(schema: GraphQLSchema) {
		this.schema = schema;
	}

	public async execute(
		ctx: Context,
		query: string,
		variables: Readonly<Record<string, unknown>> | null,
		operationName: string | null
	): Promise<ExecutionResult> {
		const documentAST = parse(new Source(query, 'GraphQL request'));
		const operationAST = getOperationAST(documentAST, operationName);

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
