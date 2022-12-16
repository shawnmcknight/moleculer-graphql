import type { Context } from 'moleculer';

export type GraphQLContextFactory<TGraphQLContext extends Record<string, unknown>> =
	() => Promise<TGraphQLContext>;

export type GraphQLContextBase = {
	$ctx: Context;
};

export type GraphQLContext<TGraphQLContext extends Record<string, unknown>> = TGraphQLContext &
	GraphQLContextBase;

async function createGraphQLContext(ctx: Context): Promise<GraphQLContextBase>;
async function createGraphQLContext<TGraphQLContext extends Record<string, unknown>>(
	ctx: Context,
	contextFactory: GraphQLContextFactory<TGraphQLContext>,
): Promise<GraphQLContext<TGraphQLContext>>;
async function createGraphQLContext(
	ctx: Context,
	contextFactory?: GraphQLContextFactory<Record<string, unknown>>,
): Promise<GraphQLContext<Record<string, unknown>>> {
	return {
		...(await contextFactory?.()),
		$ctx: ctx,
	};
}

export default createGraphQLContext;
