import type { SubschemaConfig } from '@graphql-tools/delegate';
import type { IResolvers } from '@graphql-tools/utils';
import type { GraphQLContext, GraphQLContextFactory } from '@moleculer-graphql/context';
import { defaultsDeep } from 'lodash';
import type { Context, Service, ServiceSchema, ServiceSettingSchema } from 'moleculer';
import GraphQLExecutor from './GraphQLExecutor';
import type { SchemaDirectiveTransformer } from './SchemaBuilder';
import SchemaBuilder from './SchemaBuilder';

type SubschemaConfigOmittedProps = 'schema' | 'executor' | 'merge';
type ServiceMixinSubschemaConfig<TGraphQLContext extends Record<string, unknown>> = Omit<
	SubschemaConfig<unknown, unknown, unknown, GraphQLContext<TGraphQLContext>>,
	SubschemaConfigOmittedProps
>;

export type TypeDefsFactory<TGraphQLContext extends Record<string, unknown>> = (
	this: GraphQLService<TGraphQLContext>,
) => string;
export type ResolversFactory<TGraphQLContext extends Record<string, unknown>> = (
	this: GraphQLService<TGraphQLContext>,
) => IResolvers<unknown, GraphQLContext<TGraphQLContext>>;

export interface ServiceMixinOptions<TGraphQLContext extends Record<string, unknown>> {
	typeDefs: string | TypeDefsFactory<TGraphQLContext>;
	contextFactory?: GraphQLContextFactory<TGraphQLContext>;
	resolvers?:
		| IResolvers<unknown, GraphQLContext<TGraphQLContext>>
		| ResolversFactory<TGraphQLContext>;
	schemaDirectiveTransformers?: readonly SchemaDirectiveTransformer[];
	subschemaConfig?: ServiceMixinSubschemaConfig<TGraphQLContext>;
}

interface GraphQLSettings<TGraphQLContext extends Record<string, unknown>> {
	typeDefs: string;
	subschemaConfig: ServiceMixinSubschemaConfig<TGraphQLContext>;
}
export interface GraphQLServiceSettings<TGraphQLContext extends Record<string, unknown>>
	extends ServiceSettingSchema {
	$graphql: GraphQLSettings<TGraphQLContext>;
}

export interface GraphQLService<TGraphQLContext extends Record<string, unknown>>
	extends Service<GraphQLServiceSettings<TGraphQLContext>> {
	graphQLExecutor: GraphQLExecutor<TGraphQLContext>;
}

export interface GraphQLRequest {
	query: string;
	variables: Readonly<Record<string, unknown>> | null;
	operationName: string | null;
}

export default function serviceMixin<
	TGraphQLContext extends Record<string, unknown> = Record<never, never>,
>(opts: ServiceMixinOptions<TGraphQLContext>): Partial<ServiceSchema> {
	const { schemaDirectiveTransformers, contextFactory } = opts;

	const subschemaConfig: ServiceMixinSubschemaConfig<TGraphQLContext> = defaultsDeep(
		{},
		opts.subschemaConfig,
		{ batch: true },
	);

	return {
		created(this: GraphQLService<TGraphQLContext>) {
			const typeDefs = typeof opts.typeDefs === 'string' ? opts.typeDefs : opts.typeDefs.call(this);

			const resolvers =
				opts.resolvers == null || typeof opts.resolvers === 'object'
					? opts.resolvers
					: opts.resolvers.call(this);

			const schemaBuilder = new SchemaBuilder(this, typeDefs, {
				resolvers,
				schemaDirectiveTransformers,
			});

			const schema = schemaBuilder.build();

			this.settings.$graphql = {
				typeDefs: schemaBuilder.getTypeDefs(),
				subschemaConfig,
			};

			this.graphQLExecutor = new GraphQLExecutor(schema, { contextFactory });
		},

		actions: {
			async $handleGraphQLRequest(
				this: GraphQLService<TGraphQLContext>,
				ctx: Context<GraphQLRequest>,
			) {
				const { query, variables, operationName } = ctx.params;

				return this.graphQLExecutor.execute(ctx, query, variables, operationName);
			},
		},
	};
}
