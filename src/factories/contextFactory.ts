import type { Context } from 'moleculer';

export interface GraphQLContext {
	$ctx: Context;
}

export type GraphQLContextFactory<TGraphQLContext extends GraphQLContext = GraphQLContext> = (
	ctx: Context,
) => Promise<TGraphQLContext>;

const contextFactory: GraphQLContextFactory = (ctx: Context) => {
	return Promise.resolve({ $ctx: ctx });
};

export default contextFactory;
