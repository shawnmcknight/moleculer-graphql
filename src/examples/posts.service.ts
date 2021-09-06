import { readFileSync } from 'fs';
import path from 'path';
import type { Context, ServiceBroker } from 'moleculer';
import { Service } from 'moleculer';
import serviceMixin from '../serviceMixin';

const typeDefs = readFileSync(path.join(__dirname, './posts.graphql'), 'utf8');

interface Post {
	id: string;
	authorId: string;
	message: string;
}

const posts: Post[] = [
	{
		id: '1',
		authorId: '1',
		message: 'This is a test',
	},
];

class PostsService extends Service {
	public constructor(broker: ServiceBroker) {
		super(broker);

		this.parseServiceSchema({
			name: 'posts',
			mixins: [
				serviceMixin({
					typeDefs,
					resolvers: {
						Post: {
							author: (parent: Post) => {
								return { id: parent.authorId };
							},
						},
					},
				}),
			],
			actions: {
				postById: {
					handler(ctx: Context<{ id: string }>) {
						const { id } = ctx.params;

						console.log(`called postById with ${id}`);

						const result = posts.find((post) => post.id === id);

						return result;
					},
					graphql: {
						query: 'postById',
					},
				},
			},
		});
	}
}

export default PostsService;
