import fs from 'fs';
import type { ServerResponse } from 'http';
import path from 'path';
import { GraphQLContextCreator, type GraphQLContextFactory } from '@moleculer-graphql/context';
import accepts from 'accepts';
import type { GraphQLSchema, validate as graphqlValidate } from 'graphql';
import type { Handler } from 'graphql-http';
import { createHandler } from 'graphql-http';
import type { IncomingRequest } from 'moleculer-web';

interface RequestHandlerOptions<TGraphQLContext extends Record<string, unknown>> {
	contextFactory?: GraphQLContextFactory<TGraphQLContext>;
	introspection?: boolean;
	showGraphiQL?: boolean;
}

export type Request = IncomingRequest & { body?: unknown };

class RequestHandler<TGraphQLContext extends Record<string, unknown>> {
	private readonly playgroundPath = path.join(__dirname, 'playground', 'playground.html');

	private readonly playgroundStat = fs.statSync(this.playgroundPath);

	private readonly showGraphiQL: boolean;

	private readonly handler: Handler<unknown, TGraphQLContext>;

	private readonly graphqlContextCreator: GraphQLContextCreator<TGraphQLContext>;

	public constructor(
		schema: GraphQLSchema,
		validate: typeof graphqlValidate,
		opts: RequestHandlerOptions<TGraphQLContext> = {},
	) {
		const {
			contextFactory,
			showGraphiQL = process.env.NODE_ENV !== 'production',
			introspection = process.env.NODE_ENV !== 'production',
		} = opts;

		this.showGraphiQL = introspection && showGraphiQL;

		this.graphqlContextCreator = new GraphQLContextCreator(contextFactory);

		this.handler = createHandler({
			schema,
			validate,
			context: (req) => Promise.resolve(req.context),
		});
	}

	/** Handle an incoming http request */
	public async handle(req: Request, res: ServerResponse): Promise<void> {
		if (req.url == null) {
			res.writeHead(500, 'Missing request URL').end();
			return;
		}
		if (req.method == null) {
			res.writeHead(500, 'Missing request method').end();
			return;
		}

		if (this.canDisplayGraphiQL(req)) {
			this.respondWithGraphiQL(res);
			return;
		}

		const graphQLContext = await this.graphqlContextCreator.createGraphQLContext(req.$ctx);

		const [body, { status, statusText, headers }] = await this.handler({
			url: req.url,
			method: req.method,
			headers: req.headers,
			body: () => {
				if (req.body != null && typeof req.body === 'object') {
					// in case a body parser parsed already
					return Promise.resolve(req.body as Record<string, unknown>);
				}
				return new Promise<string>((resolve) => {
					let parsedBody = '';
					req.on('data', (chunk) => {
						parsedBody += chunk;
					});
					req.on('end', () => resolve(parsedBody));
				});
			},
			raw: req,
			context: graphQLContext,
		});

		res.writeHead(status, statusText, headers).end(body);
	}

	/**
	 * Helper function to determine if GraphiQL can be displayed.
	 */
	private canDisplayGraphiQL(req: Request): boolean {
		return (
			this.showGraphiQL &&
			req.method === 'GET' &&
			Object.keys(req.query).length === 0 &&
			accepts(req).types(['json', 'html']) === 'html'
		);
	}

	/** Render GraphiQL */
	private respondWithGraphiQL(res: ServerResponse) {
		const readStream = fs.createReadStream(this.playgroundPath);

		readStream.on('error', () => {
			res.writeHead(500, 'Server error');
			res.end('Server error');
		});

		res.writeHead(200, {
			'Content-Type': 'text/html',
			'Content-Length': this.playgroundStat.size,
		});
		readStream.pipe(res);

		res.on('close', () => {
			readStream.destroy();
		});
	}
}

export default RequestHandler;
