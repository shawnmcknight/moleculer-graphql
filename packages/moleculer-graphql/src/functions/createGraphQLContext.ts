import type { Context } from 'moleculer';

export type GraphQLContextFactory<TGraphQLContext extends object> = () => Promise<TGraphQLContext>;

export type GraphQLContextBase = {
	$ctx: Context;
};

export type GraphQLContext<TGraphQLContext extends object> = TGraphQLContext & GraphQLContextBase;

async function createGraphQLContext(ctx: Context): Promise<GraphQLContextBase>;
async function createGraphQLContext<TGraphQLContext extends object>(
	ctx: Context,
	contextFactory: GraphQLContextFactory<TGraphQLContext>,
): Promise<GraphQLContext<TGraphQLContext>>;
async function createGraphQLContext(
	ctx: Context,
	contextFactory?: GraphQLContextFactory<object>,
): Promise<GraphQLContext<object>> {
	return {
		...(await contextFactory?.()),
		$ctx: ctx,
	};
}

export default createGraphQLContext;
