import { readFileSync } from 'fs';
import path from 'path';
import { serviceMixin } from '@shawnmcknight/moleculer-graphql';
import type { Context, ServiceBroker } from 'moleculer';
import { Service } from 'moleculer';
import { lowerDirectiveFactory } from '../directives';
import type {
	Author,
	AuthorByIdParams,
	AuthorByIdResult,
	AuthorCreateParams,
	AuthorCreateResult,
	AuthorsByIdParams,
	AuthorsByIdResult,
} from './types';

const typeDefs = readFileSync(path.join(__dirname, './author.graphql'), 'utf8');

const authors: Author[] = [
	{
		id: '1',
		name: 'O.J. Simpson',
		email: 'OJ@THEJUICE.COM',
	},
	{
		id: '2',
		name: 'John Steinbeck',
		email: 'GrapesOfWrathLover77@gmail.com',
	},
];

const { typeDefs: lowerDirectiveTypeDefs, transformer: lowerDirectiveTransformer } =
	lowerDirectiveFactory('lower');

class AuthorService extends Service {
	public constructor(broker: ServiceBroker) {
		super(broker);
		this.parseServiceSchema({
			name: 'author',

			mixins: [
				serviceMixin({
					typeDefs: /* GraphQL */ `
						${lowerDirectiveTypeDefs}
						${typeDefs}
					`,
					schemaDirectiveTransformers: [lowerDirectiveTransformer],
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

						const result = ids.map((id) => authors.find((author) => author.id === id) ?? null);

						return result;
					},
					graphql: {
						query: 'authorsById',
					},
				},

				authorCreate: {
					handler(ctx: Context<AuthorCreateParams>): AuthorCreateResult {
						const {
							author: { name, email },
						} = ctx.params;

						const nextId = String(Math.max(...authors.map(({ id }) => Number(id))) + 1);

						const author: Author = {
							id: nextId,
							name,
							email,
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
