import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import type { GraphQLSchema } from 'graphql';
import { defaultFieldResolver, GraphQLDirective, GraphQLObjectType } from 'graphql';
import type { Service, ServiceSchema } from 'moleculer';
import { ServiceBroker } from 'moleculer';
import SchemaBuilder from '../SchemaBuilder';

const setup = async (serviceSchema: ServiceSchema): Promise<[ServiceBroker, Service]> => {
	const broker = new ServiceBroker({ logger: false });

	const service = broker.createService(serviceSchema);

	await broker.start();

	return [broker, service];
};

const teardown = async (broker: ServiceBroker, service: Service) => {
	await broker.destroyService(service);
	await broker.stop();
};

describe('build', () => {
	test('should build root query resolver', async () => {
		const typeDefs = /* GraphQL */ `
			type Query {
				author: Author!
			}
			type Author {
				id: ID!
				name: String!
				email: String!
			}
		`;
		const serviceSchema = {
			name: 'test',
			actions: {
				author: {
					handler: () => {},
					graphql: { query: 'author' },
				},
			},
		};
		const [broker, service] = await setup(serviceSchema);

		const schemaBuilder = new SchemaBuilder(service, typeDefs);
		const schema = schemaBuilder.build();
		expect(schema.getQueryType()).toBeInstanceOf(GraphQLObjectType);
		expect(typeof schema.getQueryType()?.getFields().author.resolve).toBe('function');
		expect(schema.getMutationType()).toBeUndefined();
		expect(schema.getType('Author')).toBeInstanceOf(GraphQLObjectType);

		await teardown(broker, service);
	});

	test('should build root mutation resolver', async () => {
		const typeDefs = /* GraphQL */ `
			type Mutation {
				login: Boolean!
			}
		`;
		const serviceSchema = {
			name: 'test',
			actions: {
				login: {
					handler: () => {},
					graphql: { mutation: 'login' },
				},
			},
		};
		const [broker, service] = await setup(serviceSchema);

		const schemaBuilder = new SchemaBuilder(service, typeDefs);
		const schema = schemaBuilder.build();
		expect(schema.getQueryType()).toBeUndefined();
		expect(schema.getMutationType()).toBeInstanceOf(GraphQLObjectType);
		expect(typeof schema.getMutationType()?.getFields().login.resolve).toBe('function');

		await teardown(broker, service);
	});

	test('should build no resolvers if actions are not defined', async () => {
		const typeDefs = /* GraphQL */ `
			type Query {
				author: Author!
			}
			type Author {
				id: ID!
				name: String!
				email: String!
			}
		`;
		const serviceSchema = {
			name: 'test',
		};
		const [broker, service] = await setup(serviceSchema);

		const schemaBuilder = new SchemaBuilder(service, typeDefs);
		const schema = schemaBuilder.build();
		expect(schema.getQueryType()).toBeInstanceOf(GraphQLObjectType);
		expect(schema.getQueryType()?.getFields().author.resolve).toBeUndefined();
		expect(schema.getMutationType()).toBeUndefined();
		expect(schema.getType('Author')).toBeInstanceOf(GraphQLObjectType);

		await teardown(broker, service);
	});

	test('should build no resolvers if action does not have a graphql property', async () => {
		const typeDefs = /* GraphQL */ `
			type Query {
				author: Author!
			}
			type Author {
				id: ID!
				name: String!
				email: String!
			}
		`;
		const serviceSchema = {
			name: 'test',
			actions: {
				login: {
					handler: () => {},
				},
			},
		};
		const [broker, service] = await setup(serviceSchema);

		const schemaBuilder = new SchemaBuilder(service, typeDefs);
		const schema = schemaBuilder.build();
		expect(schema.getQueryType()).toBeInstanceOf(GraphQLObjectType);
		expect(schema.getQueryType()?.getFields().author.resolve).toBeUndefined();
		expect(schema.getMutationType()).toBeUndefined();
		expect(schema.getType('Author')).toBeInstanceOf(GraphQLObjectType);

		await teardown(broker, service);
	});

	test('should build no resolvers if action is not a schema', async () => {
		const typeDefs = /* GraphQL */ `
			type Query {
				author: Author!
			}
			type Author {
				id: ID!
				name: String!
				email: String!
			}
		`;
		const serviceSchema = {
			name: 'test',
			actions: {
				login: () => {},
			},
		};
		const [broker, service] = await setup(serviceSchema);

		const schemaBuilder = new SchemaBuilder(service, typeDefs);
		const schema = schemaBuilder.build();
		expect(schema.getQueryType()).toBeInstanceOf(GraphQLObjectType);
		expect(schema.getQueryType()?.getFields().author.resolve).toBeUndefined();
		expect(schema.getMutationType()).toBeUndefined();
		expect(schema.getType('Author')).toBeInstanceOf(GraphQLObjectType);

		await teardown(broker, service);
	});

	test('should bind action to multiple queries', async () => {
		const typeDefs = /* GraphQL */ `
			type Query {
				author1: Author!
				author2: Author!
			}
			type Author {
				id: ID!
				name: String!
				email: String!
			}
		`;
		const serviceSchema = {
			name: 'test',
			actions: {
				author: {
					handler: () => {},
					graphql: { query: ['author1', 'author2'] },
				},
			},
		};
		const [broker, service] = await setup(serviceSchema);

		const schemaBuilder = new SchemaBuilder(service, typeDefs);
		const schema = schemaBuilder.build();
		expect(schema.getQueryType()).toBeInstanceOf(GraphQLObjectType);
		expect(typeof schema.getQueryType()?.getFields().author1.resolve).toBe('function');
		expect(typeof schema.getQueryType()?.getFields().author2.resolve).toBe('function');
		expect(schema.getMutationType()).toBeUndefined();
		expect(schema.getType('Author')).toBeInstanceOf(GraphQLObjectType);

		await teardown(broker, service);
	});

	test('should bind action to multiple mutations', async () => {
		const typeDefs = /* GraphQL */ `
			type Mutation {
				login1: Boolean!
				login2: Boolean!
			}
		`;
		const serviceSchema = {
			name: 'test',
			actions: {
				login: {
					handler: () => {},
					graphql: { mutation: ['login1', 'login2'] },
				},
			},
		};
		const [broker, service] = await setup(serviceSchema);

		const schemaBuilder = new SchemaBuilder(service, typeDefs);
		const schema = schemaBuilder.build();
		expect(schema.getQueryType()).toBeUndefined();
		expect(schema.getMutationType()).toBeInstanceOf(GraphQLObjectType);
		expect(typeof schema.getMutationType()?.getFields().login1.resolve).toBe('function');
		expect(typeof schema.getMutationType()?.getFields().login2.resolve).toBe('function');

		await teardown(broker, service);
	});

	describe('directives', () => {
		test('schema should include stitching directives', async () => {
			const typeDefs = /* GraphQL */ `
				type Query {
					author: Author!
				}
				type Author {
					id: ID!
					name: String!
					email: String!
				}
			`;
			const serviceSchema = {
				name: 'test',
				actions: {
					author: {
						handler: () => {},
						graphql: { query: 'author' },
					},
				},
			};
			const [broker, service] = await setup(serviceSchema);

			const schemaBuilder = new SchemaBuilder(service, typeDefs);
			const schema = schemaBuilder.build();
			expect(schema.getDirective('merge')).toBeInstanceOf(GraphQLDirective);
			expect(schema.getDirective('key')).toBeInstanceOf(GraphQLDirective);
			expect(schema.getDirective('computed')).toBeInstanceOf(GraphQLDirective);
			expect(schema.getDirective('canonical')).toBeInstanceOf(GraphQLDirective);

			await teardown(broker, service);
		});

		test('should add custom directive to schema', async () => {
			const transformer = (schema: GraphQLSchema) =>
				mapSchema(schema, {
					[MapperKind.OBJECT_FIELD]: (fieldConfig) => {
						const lowerDirective = getDirective(schema, fieldConfig, 'lower')?.[0];

						if (lowerDirective == null) {
							return undefined;
						}

						const { resolve = defaultFieldResolver } = fieldConfig;
						// eslint-disable-next-line no-param-reassign
						fieldConfig.resolve = async (source, args, context, info) => {
							const result = await resolve(source, args, context, info);
							return typeof result === 'string' ? result.toLowerCase() : result;
						};
						return fieldConfig;
					},
				});

			const typeDefs = /* GraphQL */ `
				directive @lower on FIELD_DEFINITION
				type Query {
					author: Author!
				}
				type Author {
					id: ID!
					name: String!
					email: String! @lower
				}
			`;
			const serviceSchema = {
				name: 'test',
				actions: {
					author: {
						handler: () => {},
						graphql: { query: 'author' },
					},
				},
			};
			const [broker, service] = await setup(serviceSchema);

			const schemaBuilder = new SchemaBuilder(service, typeDefs, {
				schemaDirectiveTransformers: [transformer],
			});
			const schema = schemaBuilder.build();
			expect(schema.getDirective('lower')).toBeInstanceOf(GraphQLDirective);

			await teardown(broker, service);
		});
	});
});

describe('getTypeDefs', () => {
	test('should return supplied typeDefs and stitching directives typeDefs', async () => {
		const typeDefs = /* GraphQL */ `
			type Query {
				author: Author!
			}
			type Author {
				id: ID!
				name: String!
				email: String!
			}
		`;
		const serviceSchema = {
			name: 'test',
			actions: {
				author: {
					handler: () => {},
					graphql: { query: 'author' },
				},
			},
		};
		const [broker, service] = await setup(serviceSchema);

		const schemaBuilder = new SchemaBuilder(service, typeDefs);
		const result = schemaBuilder.getTypeDefs();
		expect(result).toContain(typeDefs);
		expect(result).toContain('@merge');
		expect(result).toContain('@key');
		expect(result).toContain('@computed');
		expect(result).toContain('@canonical');

		await teardown(broker, service);
	});
});
