import { readFileSync } from 'fs';
import path from 'path';
import type { Context, ServiceBroker } from 'moleculer';
import { Service } from 'moleculer';
import { serviceMixin } from '../../src';

const typeDefs = readFileSync(path.join(__dirname, './author.graphql'), 'utf8');

interface Author {
	id: string;
	name: string;
}

const authors: Author[] = [
	{
		id: '1',
		name: 'O.J. Simpson',
	},
	{
		id: '2',
		name: 'John Steinbeck',
	},
];

class AuthorService extends Service {
	public constructor(broker: ServiceBroker) {
		super(broker);
		this.parseServiceSchema({
			name: 'author',

			mixins: [
				serviceMixin({
					typeDefs,
				}),
			],

			actions: {
				authorById: {
					handler(ctx: Context<{ id: string }>) {
						const { id } = ctx.params;

						const result = authors.find((author) => author.id === id);

						return result;
					},
					graphql: {
						query: 'authorById',
					},
				},
				authorsById: {
					handler(ctx: Context<{ ids: string[] }>) {
						const { ids } = ctx.params;

						const result = authors.filter((author) => {
							return ids.includes(author.id);
						});

						return result;
					},
					graphql: {
						query: 'authorsById',
					},
				},
			},
		});
	}
}

export default AuthorService;
