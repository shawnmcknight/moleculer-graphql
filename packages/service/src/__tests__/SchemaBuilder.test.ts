import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import type { GraphQLSchema } from 'graphql';
import { defaultFieldResolver, GraphQLDirective, GraphQLObjectType } from 'graphql';
import type { Service } from 'moleculer';
import { ServiceBroker } from 'moleculer';
import SchemaBuilder from '../SchemaBuilder';

const broker = new ServiceBroker({ logger: false });

let service: Service;

beforeAll(async () => {
	await broker.start();
});

afterEach(async () => {
	await broker.destroyService(service);
});

afterAll(async () => {
	await broker.stop();
});

describe('build', () => {
	test('should build root query resolver', () => {
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
		service = broker.createService({
			name: 'test',
			actions: {
				author: {
					handler: () => {},
					graphql: { query: 'author' },
				},
			},
		});
		const schemaBuilder = new SchemaBuilder(service, typeDefs);

		const schema = schemaBuilder.build();

		expect(schema.getQueryType()).toBeInstanceOf(GraphQLObjectType);
		expect(typeof schema.getQueryType()?.getFields().author.resolve).toBe('function');
		expect(schema.getMutationType()).toBeUndefined();
		expect(schema.getType('Author')).toBeInstanceOf(GraphQLObjectType);
	});

	test('should build root mutation resolver', () => {
		const typeDefs = /* GraphQL */ `
			type Mutation {
				login: Boolean!
			}
		`;
		service = broker.createService({
			name: 'test',
			actions: {
				login: {
					handler: () => {},
					graphql: { mutation: 'login' },
				},
			},
		});
		const schemaBuilder = new SchemaBuilder(service, typeDefs);

		const schema = schemaBuilder.build();

		expect(schema.getQueryType()).toBeUndefined();
		expect(schema.getMutationType()).toBeInstanceOf(GraphQLObjectType);
		expect(typeof schema.getMutationType()?.getFields().login.resolve).toBe('function');
	});

	test('should build no resolvers if actions are not defined', () => {
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
		service = broker.createService({
			name: 'test',
		});
		const schemaBuilder = new SchemaBuilder(service, typeDefs);

		const schema = schemaBuilder.build();

		expect(schema.getQueryType()).toBeInstanceOf(GraphQLObjectType);
		expect(schema.getQueryType()?.getFields().author.resolve).toBeUndefined();
		expect(schema.getMutationType()).toBeUndefined();
		expect(schema.getType('Author')).toBeInstanceOf(GraphQLObjectType);
	});

	test('should build no resolvers if action does not have a graphql property', () => {
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
		service = broker.createService({
			name: 'test',
			actions: {
				login: {
					handler: () => {},
				},
			},
		});
		const schemaBuilder = new SchemaBuilder(service, typeDefs);

		const schema = schemaBuilder.build();

		expect(schema.getQueryType()).toBeInstanceOf(GraphQLObjectType);
		expect(schema.getQueryType()?.getFields().author.resolve).toBeUndefined();
		expect(schema.getMutationType()).toBeUndefined();
		expect(schema.getType('Author')).toBeInstanceOf(GraphQLObjectType);
	});

	test('should build no resolvers if action is not a schema', () => {
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
		service = broker.createService({
			name: 'test',
			actions: {
				login: () => {},
			},
		});
		const schemaBuilder = new SchemaBuilder(service, typeDefs);

		const schema = schemaBuilder.build();

		expect(schema.getQueryType()).toBeInstanceOf(GraphQLObjectType);
		expect(schema.getQueryType()?.getFields().author.resolve).toBeUndefined();
		expect(schema.getMutationType()).toBeUndefined();
		expect(schema.getType('Author')).toBeInstanceOf(GraphQLObjectType);
	});

	test('should bind action to multiple queries', () => {
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
		service = broker.createService({
			name: 'test',
			actions: {
				author: {
					handler: () => {},
					graphql: { query: ['author1', 'author2'] },
				},
			},
		});
		const schemaBuilder = new SchemaBuilder(service, typeDefs);

		const schema = schemaBuilder.build();

		expect(schema.getQueryType()).toBeInstanceOf(GraphQLObjectType);
		expect(typeof schema.getQueryType()?.getFields().author1.resolve).toBe('function');
		expect(typeof schema.getQueryType()?.getFields().author2.resolve).toBe('function');
		expect(schema.getMutationType()).toBeUndefined();
		expect(schema.getType('Author')).toBeInstanceOf(GraphQLObjectType);
	});

	test('should bind action to multiple mutations', () => {
		const typeDefs = /* GraphQL */ `
			type Mutation {
				login1: Boolean!
				login2: Boolean!
			}
		`;
		service = broker.createService({
			name: 'test',
			actions: {
				login: {
					handler: () => {},
					graphql: { mutation: ['login1', 'login2'] },
				},
			},
		});
		const schemaBuilder = new SchemaBuilder(service, typeDefs);

		const schema = schemaBuilder.build();

		expect(schema.getQueryType()).toBeUndefined();
		expect(schema.getMutationType()).toBeInstanceOf(GraphQLObjectType);
		expect(typeof schema.getMutationType()?.getFields().login1.resolve).toBe('function');
		expect(typeof schema.getMutationType()?.getFields().login2.resolve).toBe('function');
	});

	describe('directives', () => {
		test('schema should include stitching directives', () => {
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
			service = broker.createService({
				name: 'test',
				actions: {
					author: {
						handler: () => {},
						graphql: { query: 'author' },
					},
				},
			});
			const schemaBuilder = new SchemaBuilder(service, typeDefs);

			const schema = schemaBuilder.build();

			expect(schema.getDirective('merge')).toBeInstanceOf(GraphQLDirective);
			expect(schema.getDirective('key')).toBeInstanceOf(GraphQLDirective);
			expect(schema.getDirective('computed')).toBeInstanceOf(GraphQLDirective);
			expect(schema.getDirective('canonical')).toBeInstanceOf(GraphQLDirective);
		});

		test('should add custom directive to schema', () => {
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
			service = broker.createService({
				name: 'test',
				actions: {
					author: {
						handler: () => {},
						graphql: { query: 'author' },
					},
				},
			});
			const schemaBuilder = new SchemaBuilder(service, typeDefs, {
				schemaDirectiveTransformers: [transformer],
			});

			const schema = schemaBuilder.build();

			expect(schema.getDirective('lower')).toBeInstanceOf(GraphQLDirective);
		});
	});
});

describe('getTypeDefs', () => {
	test('should return supplied typeDefs and stitching directives typeDefs', () => {
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
		service = broker.createService({
			name: 'test',
			actions: {
				author: {
					handler: () => {},
					graphql: { query: 'author' },
				},
			},
		});
		const schemaBuilder = new SchemaBuilder(service, typeDefs);

		const result = schemaBuilder.getTypeDefs();

		expect(result).toContain(typeDefs);
		expect(result).toContain('@merge');
		expect(result).toContain('@key');
		expect(result).toContain('@computed');
		expect(result).toContain('@canonical');
	});
});
