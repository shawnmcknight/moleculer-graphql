import type { GraphQLSchema, ExecutionResult } from 'graphql';
import { Source, execute, parse, getOperationAST } from 'graphql';
import type { Context } from 'moleculer';

export interface GraphQLRequest {
	query: string;
	variables: Readonly<Record<string, unknown>>;
	operationName: string | null;
}

class GraphQLExecutor {
	private schema: GraphQLSchema;

	public constructor(schema: GraphQLSchema) {
		this.schema = schema;
	}

	public async execute(ctx: Context<GraphQLRequest>): Promise<ExecutionResult> {
		const { query, variables, operationName } = ctx.params;

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
