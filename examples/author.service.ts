import { readFileSync } from 'fs';
import path from 'path';
import type { Context, ServiceBroker } from 'moleculer';
import { Service } from 'moleculer';
import { serviceMixin } from '../src';

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
			},
		});
	}
}

export default AuthorService;
