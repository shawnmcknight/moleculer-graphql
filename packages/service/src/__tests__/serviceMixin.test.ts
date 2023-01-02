import type { Service } from 'moleculer';
import { ServiceBroker } from 'moleculer';
import serviceMixin from '../serviceMixin';

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

test('should execute simple query', async () => {
	const typeDefs = /* GraphQL */ `
		type Query {
			hello: String!
		}
	`;

	service = broker.createService({
		name: 'test',
		mixins: [serviceMixin({ typeDefs })],
		actions: {
			hello: {
				handler() {
					return 'world';
				},
				graphql: { query: 'hello' },
			},
		},
	});

	const query = /* GraphQL */ `
		query {
			hello
		}
	`;

	await broker.waitForServices('test', 1000, 10);

	const result = await broker.call('test.$handleGraphQLRequest', { query });

	expect(result).toEqual({ data: { hello: 'world' } });
});

test('should execute query using resolvers', async () => {
	const typeDefs = /* GraphQL */ `
		type Query {
			author: Author
		}
		type Author {
			id: ID!
			name: String!
			book: Book!
		}
		type Book {
			id: ID!
			title: String!
		}
	`;

	service = broker.createService({
		name: 'test',
		mixins: [
			serviceMixin({
				typeDefs,
				resolvers: { Author: { book: () => ({ id: '1', title: 'Of Mice and Men' }) } },
			}),
		],
		actions: {
			author: {
				handler() {
					return { id: '1', name: 'John Steinbeck', bookId: '1' };
				},
				graphql: { query: 'author' },
			},
		},
	});

	const query = /* GraphQL */ `
		query {
			author {
				id
				name
				book {
					id
					title
				}
			}
		}
	`;

	await broker.waitForServices('test', 1000, 10);

	const result = await broker.call('test.$handleGraphQLRequest', { query });

	expect(result).toEqual({
		data: {
			author: { id: '1', name: 'John Steinbeck', book: { id: '1', title: 'Of Mice and Men' } },
		},
	});
});

test('should build typeDefs from a factory function', async () => {
	const typeDefsFactory = () => /* GraphQL */ `
		type Query {
			hello: String!
		}
	`;

	service = broker.createService({
		name: 'test',
		mixins: [serviceMixin({ typeDefs: typeDefsFactory })],
		actions: {
			hello: {
				handler() {
					return 'world';
				},
				graphql: { query: 'hello' },
			},
		},
	});

	const query = /* GraphQL */ `
		query {
			hello
		}
	`;

	await broker.waitForServices('test', 1000, 10);

	const result = await broker.call('test.$handleGraphQLRequest', { query });

	expect(result).toEqual({ data: { hello: 'world' } });
});

test('should build resolvers from a factory function', async () => {
	const typeDefs = /* GraphQL */ `
		type Query {
			author: Author
		}
		type Author {
			id: ID!
			name: String!
			book: Book!
		}
		type Book {
			id: ID!
			title: String!
		}
	`;

	const resolversFactory = () => ({
		Author: { book: () => ({ id: '1', title: 'Of Mice and Men' }) },
	});

	service = broker.createService({
		name: 'test',
		mixins: [serviceMixin({ typeDefs, resolvers: resolversFactory })],
		actions: {
			author: {
				handler() {
					return { id: '1', name: 'John Steinbeck', bookId: '1' };
				},
				graphql: { query: 'author' },
			},
		},
	});

	const query = /* GraphQL */ `
		query {
			author {
				id
				name
				book {
					id
					title
				}
			}
		}
	`;

	await broker.waitForServices('test', 1000, 10);

	const result = await broker.call('test.$handleGraphQLRequest', { query });

	expect(result).toEqual({
		data: {
			author: { id: '1', name: 'John Steinbeck', book: { id: '1', title: 'Of Mice and Men' } },
		},
	});
});
