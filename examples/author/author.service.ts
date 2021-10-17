import { readFileSync } from 'fs';
import path from 'path';
import type { Context, ServiceBroker } from 'moleculer';
import { Service } from 'moleculer';
import { serviceMixin } from '../../src';
import type {
	Author,
	AuthorByIdParams,
	AuthorByIdResult,
	AuthorsByIdParams,
	AuthorsByIdResult,
	AuthorCreateParams,
	AuthorCreateResult,
} from './types';

const typeDefs = readFileSync(path.join(__dirname, './author.graphql'), 'utf8');

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
					handler(ctx: Context<AuthorByIdParams>): AuthorByIdResult {
						const { id } = ctx.params;

						const result = authors.find((author) => author.id === id);

						return result ?? null;
					},
					graphql: {
						query: 'authorById',
					},
				},

				authorsById: {
					handler(ctx: Context<AuthorsByIdParams>): AuthorsByIdResult {
						const { ids } = ctx.params;

						const result = ids.map((id) => {
							return authors.find((author) => author.id === id) ?? null;
						});

						return result;
					},
					graphql: {
						query: 'authorsById',
					},
				},

				authorCreate: {
					handler(ctx: Context<AuthorCreateParams>): AuthorCreateResult {
						const {
							author: { name },
						} = ctx.params;

						const nextId = String(
							Math.max(
								...authors.map(({ id }) => {
									return Number(id);
								}),
							) + 1,
						);

						const author: Author = {
							id: nextId,
							name,
						};

						authors.push(author);
						return author;
					},
					graphql: {
						mutation: 'authorCreate',
					},
				},
			},
		});
	}
}

export default AuthorService;
