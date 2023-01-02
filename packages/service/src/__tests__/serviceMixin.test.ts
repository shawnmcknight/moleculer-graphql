import type { Service, ServiceSchema } from 'moleculer';
import { ServiceBroker } from 'moleculer';
import serviceMixin from '../serviceMixin';

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

test('should execute simple query', async () => {
	const typeDefs = /* GraphQL */ `
		type Query {
			hello: String!
		}
	`;
	const serviceSchema = {
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
	};
	const [broker, service] = await setup(serviceSchema);

	const query = /* GraphQL */ `
		query {
			hello
		}
	`;
	const result = await broker.call('test.$handleGraphQLRequest', { query });
	expect(result).toEqual({ data: { hello: 'world' } });

	await teardown(broker, service);
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
	const serviceSchema = {
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
	};
	const [broker, service] = await setup(serviceSchema);

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
	const result = await broker.call('test.$handleGraphQLRequest', { query });
	expect(result).toEqual({
		data: {
			author: { id: '1', name: 'John Steinbeck', book: { id: '1', title: 'Of Mice and Men' } },
		},
	});

	await teardown(broker, service);
});

test('should build typeDefs from a factory function', async () => {
	const typeDefsFactory = () => /* GraphQL */ `
		type Query {
			hello: String!
		}
	`;
	const serviceSchema = {
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
	};
	const [broker, service] = await setup(serviceSchema);

	const query = /* GraphQL */ `
		query {
			hello
		}
	`;
	const result = await broker.call('test.$handleGraphQLRequest', { query });
	expect(result).toEqual({ data: { hello: 'world' } });

	await teardown(broker, service);
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
	const serviceSchema = {
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
	};
	const [broker, service] = await setup(serviceSchema);

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
	const result = await broker.call('test.$handleGraphQLRequest', { query });
	expect(result).toEqual({
		data: {
			author: { id: '1', name: 'John Steinbeck', book: { id: '1', title: 'Of Mice and Men' } },
		},
	});

	await teardown(broker, service);
});
