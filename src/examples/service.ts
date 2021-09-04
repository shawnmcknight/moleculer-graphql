import { readFileSync } from 'fs';
import path from 'path';
import type { Context } from 'moleculer';
import { ServiceBroker } from 'moleculer';
import serviceMixin from '../serviceMixin';

const typeDefs = readFileSync(path.join(__dirname, './posts.graphql'), 'utf8');

const broker = new ServiceBroker();

const posts = [
	{
		id: '1',
		authorId: '1',
		message: 'This is a test',
	},
];

broker.createService({
	name: 'posts',
	// @ts-ignore: foo
	mixins: [serviceMixin({ typeDefs })],
	actions: {
		postById: {
			handler(ctx: Context<{ id: string }>) {
				const { id } = ctx.params;

				const result = posts.find((post) => post.id === id);

				return result;
			},
			graphql: {
				query: 'postById',
			},
		},
	},
});

const query = `{
	postById(id: "1") {
		id
		authorId
		message
	}
}`;

broker.start().then(() => {
	// broker
	// 	.call('posts.postById', { id: '1' })
	// 	.then((result) => {
	// 		console.log(result);
	// 	})
	// 	.catch((err) => {
	// 		console.log(err);
	// 	});

	broker
		.call('posts.handleGraphQLRequest', { query })
		.then((result) => {
			console.log('graphQLresult', result);
		})
		.catch((err) => {
			console.log(err);
		});
});
