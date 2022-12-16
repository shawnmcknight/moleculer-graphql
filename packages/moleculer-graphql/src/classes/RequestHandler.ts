import fs from 'fs';
import type { ServerResponse } from 'http';
import path from 'path';
import accepts from 'accepts';
import type { GraphQLSchema, ValidationRule } from 'graphql';
import type { Handler } from 'graphql-http';
import { createHandler } from 'graphql-http';
import type { IncomingRequest } from 'moleculer-web';
import { createGraphQLContext, createValidate } from '../functions';
import type { GraphQLContext, GraphQLContextFactory } from '../functions';

interface RequestHandlerOptions<TGraphQLContext extends Record<string, unknown>> {
	contextFactory?: GraphQLContextFactory<TGraphQLContext>;
	introspection?: boolean;
	showGraphiQL?: boolean;
	validationRules?: readonly ValidationRule[];
}

export type Request = IncomingRequest & { url: string; body?: unknown };

class RequestHandler<TGraphQLContext extends Record<string, unknown>> {
	private readonly playgroundPath = path.join(__dirname, '..', 'playground', 'playground.html');

	private readonly playgroundStat = fs.statSync(this.playgroundPath);

	private readonly showGraphiQL: boolean;

	private readonly handler: Handler<unknown, TGraphQLContext>;

	private readonly contextFactory?: GraphQLContextFactory<TGraphQLContext>;

	public constructor(schema: GraphQLSchema, opts: RequestHandlerOptions<TGraphQLContext> = {}) {
		const {
			contextFactory,
			showGraphiQL = process.env.NODE_ENV !== 'production',
			introspection = process.env.NODE_ENV !== 'production',
			validationRules,
		} = opts;

		this.showGraphiQL = introspection && showGraphiQL;

		const validate = createValidate({ introspection, validationRules });

		this.contextFactory = contextFactory;

		this.handler = createHandler({
			schema,
			validate,
			context: (req) => Promise.resolve(req.context),
		});
	}

	public async handle(req: Request, res: ServerResponse): Promise<void> {
		if (req.method == null) {
			throw new Error();
		}

		if (this.canDisplayGraphiQL(req)) {
			this.respondWithGraphiQL(res);
			return;
		}

		const graphQLContext =
			this.contextFactory != null
				? await createGraphQLContext(req.$ctx, this.contextFactory)
				: ((await createGraphQLContext(req.$ctx)) as GraphQLContext<TGraphQLContext>);

		const [body, init] = await this.handler({
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
		res.writeHead(init.status, init.statusText, init.headers).end(body);
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
