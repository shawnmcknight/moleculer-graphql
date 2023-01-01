import { GraphQLID, GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { mock } from 'jest-mock-extended';
import type { Context } from 'moleculer';
import GraphQLExecutor from '../GraphQLExecutor';

const contextMock = mock<Context>();

describe('simple schema', () => {
	const schema = new GraphQLSchema({
		query: new GraphQLObjectType({
			name: 'RootQueryType',
			fields: {
				hello: {
					type: GraphQLString,
					resolve() {
						return 'Hello world';
					},
				},
				greet: {
					type: GraphQLString,
					args: { name: { type: GraphQLString } },
					resolve(parent, args) {
						return `Hello ${args.name}`;
					},
				},
			},
		}),
	});
	const graphQLExecutor = new GraphQLExecutor(schema);

	test('should execute graphql operation', async () => {
		const query = /* GraphQL */ `
			query {
				greet(name: "John Doe")
			}
		`;

		const result = await graphQLExecutor.execute(contextMock, query, null, null);
		const expected = { data: { greet: 'Hello John Doe' } };
		expect(result).toEqual(expected);
	});

	test('should execute graphql operation with variables', async () => {
		const query = /* GraphQL */ `
			query Foo($name: String) {
				greet(name: $name)
			}
		`;
		const variables = { name: 'Jane Doe' };

		const result = await graphQLExecutor.execute(contextMock, query, variables, null);
		const expected = { data: { greet: 'Hello Jane Doe' } };
		expect(result).toEqual(expected);
	});

	test('should execute graphql operation with operation name', async () => {
		const query = /* GraphQL */ `
			query John {
				greet(name: "John Doe")
			}
			query Jane {
				greet(name: "Jane Doe")
			}
		`;
		const operationName = 'John';

		const result = await graphQLExecutor.execute(contextMock, query, null, operationName);
		const expected = { data: { greet: 'Hello John Doe' } };
		expect(result).toEqual(expected);
	});

	test('should execute multiple graphql operations', async () => {
		const query = /* GraphQL */ `
			query {
				greet(name: "John Doe")
				hello
			}
		`;

		const result = await graphQLExecutor.execute(contextMock, query, null, null);
		const expected = { data: { greet: 'Hello John Doe', hello: 'Hello world' } };
		expect(result).toEqual(expected);
	});

	test('should execute multiple graphql operations with aliases', async () => {
		const query = /* GraphQL */ `
			query {
				John: greet(name: "John Doe")
				Jane: greet(name: "Jane Doe")
			}
		`;

		const result = await graphQLExecutor.execute(contextMock, query, null, null);
		const expected = {
			data: { John: 'Hello John Doe', Jane: 'Hello Jane Doe' },
		};
		expect(result).toEqual(expected);
	});
});

describe('complex schemas', () => {
	const bookObject = new GraphQLObjectType({
		name: 'book',
		fields: {
			id: { type: GraphQLID },
			title: { type: GraphQLString },
		},
	});
	const authorObject = new GraphQLObjectType({
		name: 'author',
		fields: {
			name: { type: GraphQLString },
			book: {
				type: bookObject,
				resolve(parent) {
					return { id: parent.bookId, title: 'Of Mice and Men' };
				},
			},
		},
	});

	const schema = new GraphQLSchema({
		query: new GraphQLObjectType({
			name: 'RootQueryType',
			fields: {
				author: {
					type: authorObject,
					resolve() {
						return { name: 'John Steinbeck', bookId: '1' };
					},
				},
			},
		}),
	});
	const graphQLExecutor = new GraphQLExecutor(schema);

	test('should child resolve book object', async () => {
		const query = /* GraphQL */ `
			query {
				author {
					name
					book {
						id
						title
					}
				}
			}
		`;

		const result = await graphQLExecutor.execute(contextMock, query, null, null);
		const expected = {
			data: { author: { name: 'John Steinbeck', book: { id: '1', title: 'Of Mice and Men' } } },
		};
		expect(result).toEqual(expected);
	});
});
