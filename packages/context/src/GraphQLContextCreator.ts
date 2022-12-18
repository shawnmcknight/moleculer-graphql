import type { Context } from 'moleculer';

export type GraphQLContextFactory<TGraphQLContext extends Record<string, unknown>> =
	() => Promise<TGraphQLContext>;

export type GraphQLContextBase = {
	$ctx: Context;
};

export type GraphQLContext<TGraphQLContext extends Record<string, unknown>> = TGraphQLContext &
	GraphQLContextBase;

class GraphQLContextCreator<TGraphQLContext extends Record<string, unknown>> {
	private readonly contextFactory?: GraphQLContextFactory<TGraphQLContext>;

	public constructor(contextFactory?: GraphQLContextFactory<TGraphQLContext>) {
		this.contextFactory = contextFactory;
	}

	public async createGraphQLContext(ctx: Context) {
		return {
			...(await this.contextFactory?.()),
			$ctx: ctx,
		} as GraphQLContext<TGraphQLContext>;
	}
}

export default GraphQLContextCreator;
