import { makeExecutableSchema } from '@graphql-tools/schema';
import type { GraphQLSchema } from 'graphql';
import type { Service, Context } from 'moleculer';
import { ensureArray } from './utils';

type ActionResolver = (parent: unknown, args: Record<string, any>, ctx: Context) => unknown;

class SchemaBuilder {
	private service: Service;

	private typeDefs: string;

	public constructor(service: Service, typeDefs: string) {
		this.service = service;
		this.typeDefs = typeDefs;
	}

	public build(): GraphQLSchema {
		const resolvers = this.createResolvers();

		const schema = makeExecutableSchema({ typeDefs: this.typeDefs, resolvers });

		return schema;
	}

	private createResolvers() {
		const actions = this.service.broker.registry.actions.list({
			onlyLocal: true,
			skipInternal: true,
		});

		interface ActionResolvers {
			queryResolvers: Record<string, ActionResolver>;
			mutationResolvers: Record<string, ActionResolver>;
		}

		const { queryResolvers, mutationResolvers } = actions.reduce<ActionResolvers>(
			(acc, actionSchema) => {
				const { graphql } = actionSchema.action;

				if (graphql == null) {
					return acc;
				}

				if (graphql.query != null) {
					const queries = ensureArray(graphql.query);

					queries.forEach((query) => {
						acc.queryResolvers[query] = this.makeActionResolver(actionSchema.name);
					});
				}

				if (graphql.mutation != null) {
					const mutations = ensureArray(graphql.mutation);

					mutations.forEach((mutation) => {
						acc.mutationResolvers[mutation] = this.makeActionResolver(actionSchema.name);
					});
				}

				return acc;
			},
			{ queryResolvers: {}, mutationResolvers: {} }
		);

		const rootResolver = {
			...(Object.keys(queryResolvers).length > 0 && { Query: queryResolvers }),
			...(Object.keys(mutationResolvers).length > 0 && { Mutation: mutationResolvers }),
		};

		return rootResolver;
	}

	private makeActionResolver(actionName: string): ActionResolver {
		const fullActionName = this.buildFullActionName(actionName);

		return (parent, args, ctx) => {
			return ctx.call(fullActionName, args);
		};
	}

	private buildFullActionName(actionName: string): string {
		const prefix = this.service.version != null ? `v${this.service.version}` : '';

		return `${prefix}${actionName}`;
	}
}

export default SchemaBuilder;
