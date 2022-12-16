import { mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { stitchingDirectives } from '@graphql-tools/stitching-directives';
import type { IFieldResolver, IResolvers } from '@graphql-tools/utils';
import type { GraphQLSchema } from 'graphql';
import type { Service } from 'moleculer';
import type { GraphQLContext } from '../functions';
import { buildFullActionName, ensureArray } from '../utils';

export type SchemaDirectiveTransformer = (schema: GraphQLSchema) => GraphQLSchema;

interface SchemaBuilderOptions<TGraphQLContext extends Record<string, unknown>> {
	resolvers?: IResolvers<unknown, GraphQLContext<TGraphQLContext>>;
	schemaDirectiveTransformers?: readonly SchemaDirectiveTransformer[];
}

class SchemaBuilder<TGraphQLContext extends Record<string, unknown>> {
	private service: Service;

	private typeDefs: string;

	private resolvers?: IResolvers<unknown, GraphQLContext<TGraphQLContext>>;

	private schemaDirectiveTransformers: readonly SchemaDirectiveTransformer[];

	public constructor(
		service: Service,
		typeDefs: string,
		opts: SchemaBuilderOptions<TGraphQLContext> = {},
	) {
		this.service = service;

		const { stitchingDirectivesTypeDefs } = stitchingDirectives();

		this.typeDefs = /* GraphQL */ `
			${stitchingDirectivesTypeDefs}
			${typeDefs}
		`;

		const { resolvers, schemaDirectiveTransformers } = opts;
		this.resolvers = resolvers;
		this.schemaDirectiveTransformers = ensureArray(schemaDirectiveTransformers);
	}

	public build(): GraphQLSchema {
		const rootResolver = this.createRootResolver();

		const resolvers = mergeResolvers([rootResolver, this.resolvers]);

		const { stitchingDirectivesValidator } = stitchingDirectives();

		const baseSchema = stitchingDirectivesValidator(
			makeExecutableSchema<GraphQLContext<TGraphQLContext>>({ typeDefs: this.typeDefs, resolvers }),
		);

		const schema = this.schemaDirectiveTransformers.reduce(
			(acc, schemaDirectiveTransformer) => schemaDirectiveTransformer(acc),
			baseSchema,
		);

		return schema;
	}

	public getTypeDefs(): string {
		return this.typeDefs;
	}

	private createRootResolver(): IResolvers<unknown, TGraphQLContext> {
		interface ActionResolvers {
			queryResolvers: Record<string, IFieldResolver<unknown, GraphQLContext<TGraphQLContext>>>;
			mutationResolvers: Record<string, IFieldResolver<unknown, GraphQLContext<TGraphQLContext>>>;
		}

		if (this.service.schema.actions == null) {
			return {};
		}

		const { queryResolvers, mutationResolvers } = Object.entries(
			this.service.schema.actions,
		).reduce<ActionResolvers>(
			(acc, [actionName, actionSchema]) => {
				if (typeof actionSchema !== 'object') {
					return acc;
				}

				const { graphql } = actionSchema;

				if (graphql == null) {
					return acc;
				}

				if (graphql.query != null) {
					const queries = ensureArray(graphql.query);

					queries.forEach((query) => {
						acc.queryResolvers[query] = this.makeActionResolver(actionName);
					});
				}

				if (graphql.mutation != null) {
					const mutations = ensureArray(graphql.mutation);

					mutations.forEach((mutation) => {
						acc.mutationResolvers[mutation] = this.makeActionResolver(actionName);
					});
				}

				return acc;
			},
			{ queryResolvers: {}, mutationResolvers: {} },
		);

		const rootResolver = {
			...(Object.keys(queryResolvers).length > 0 && { Query: queryResolvers }),
			...(Object.keys(mutationResolvers).length > 0 && { Mutation: mutationResolvers }),
		};

		return rootResolver;
	}

	private makeActionResolver(
		actionName: string,
	): IFieldResolver<unknown, GraphQLContext<TGraphQLContext>> {
		const fullActionName = buildFullActionName(this.service.name, actionName, this.service.version);

		return (parent, args, graphQLContext) => graphQLContext.$ctx.call(fullActionName, args);
	}
}

export default SchemaBuilder;
