import { readFileSync } from 'fs';
import path from 'path';
import type { Context, ServiceBroker } from 'moleculer';
import { Service } from 'moleculer';
import { serviceMixin } from '../../src';
import type { AuthorByIdParams, AuthorByIdResult } from '../author/types';
import type {
	Post,
	PostAuthor,
	PostByIdParams,
	PostByIdResult,
	PostsByIdParams,
	PostsByIdResult,
	PostCreateParams,
	PostCreateResult,
} from './types';

const typeDefs = readFileSync(path.join(__dirname, './post.graphql'), 'utf8');

const posts: Post[] = [
	{
		id: '1',
		authorId: '1',
		message: 'This is a test',
	},
	{
		id: '2',
		authorId: '2',
		message: "How can we live without our lives? How will we know it's us without our past?",
	},
];

class PostService extends Service {
	public constructor(broker: ServiceBroker) {
		super(broker);

		this.parseServiceSchema({
			name: 'post',
			mixins: [
				serviceMixin({
					typeDefs,
					resolvers: {
						Author: {
							posts: (parent: PostAuthor, args, context) => {
								context.$ctx.broker.logger.debug('Executing Author.posts resolver');
								return posts.filter((post) => {
									return parent.id === post.authorId;
								});
							},
						},

						Post: {
							author: (parent: Post, args, context): PostAuthor => {
								context.$ctx.broker.logger.debug('Executing Post.author resolver');
								return { id: parent.authorId };
							},
							error: (): never => {
								throw new Error('Test of a property which throws errors');
							},
						},

						Query: {
							postAuthorById: (
								parent: unknown,
								args: { authorIds: string[] },
								context,
							): PostAuthor[] => {
								context.$ctx.broker.logger.debug('Executing Query.postAuthorById resolver');
								const { authorIds } = args;

								return authorIds.map((id: string) => {
									return { id };
								});
							},
						},
					},
				}),
			],
			actions: {
				postById: {
					handler(ctx: Context<PostByIdParams>): PostByIdResult {
						const { id } = ctx.params;

						const result = posts.find((post) => post.id === id);

						return result ?? null;
					},
					graphql: {
						query: 'postById',
					},
				},

				postsById: {
					handler(ctx: Context<PostsByIdParams>): PostsByIdResult {
						const { ids } = ctx.params;

						const result = ids.map((id) => {
							return posts.find((post) => post.id === id) ?? null;
						});

						return result;
					},
					graphql: {
						query: 'postsById',
					},
				},

				postCreate: {
					async handler(ctx: Context<PostCreateParams>): Promise<PostCreateResult> {
						const {
							post: { authorId, message },
						} = ctx.params;

						const author = await ctx.call<AuthorByIdResult, AuthorByIdParams>('author.authorById', {
							id: authorId,
						});

						if (author == null) {
							throw new Error('AuthorId not found');
						}

						const nextId = String(
							Math.max(
								...posts.map(({ id }) => {
									return Number(id);
								}),
							) + 1,
						);

						const post: Post = {
							id: nextId,
							authorId,
							message,
						};

						posts.push(post);
						return post;
					},
					graphql: {
						mutation: 'postCreate',
					},
				},
			},
		});
	}
}

export default PostService;
