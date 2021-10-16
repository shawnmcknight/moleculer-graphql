import fs from 'fs';
import type { ServerResponse } from 'http';
import path from 'path';
import accepts from 'accepts';
import { GraphQLError, formatError, specifiedRules } from 'graphql';
import type {
	GraphQLSchema,
	ValidationRule,
	ExecutionResult,
	FormattedExecutionResult,
} from 'graphql';
import httpError from 'http-errors';
import type { IncomingRequest } from 'moleculer-web';
import type { GraphQLContextFactory } from '../factories';
import { disableIntrospectionRule } from '../validationRules';
import GraphQLExecutor from './GraphQLExecutor';
import type { GraphQLParams } from './RequestParser';
import RequestParser from './RequestParser';

interface RequestHandlerOptions {
	introspection?: boolean;
	showGraphiQL?: boolean;
	validationRules?: readonly ValidationRule[];
}

export type Request = IncomingRequest & { url: string; body?: unknown };

class RequestHandler {
	private requestParser: RequestParser = new RequestParser();

	private graphQLExecutor: GraphQLExecutor;

	private playgroundPath = path.join(__dirname, '..', 'playground', 'playground.html');

	private playgroundStat = fs.statSync(this.playgroundPath);

	private showGraphiQL: boolean;

	private validationRules: readonly ValidationRule[];

	public constructor(
		schema: GraphQLSchema,
		contextFactory: GraphQLContextFactory,
		opts: RequestHandlerOptions = {},
	) {
		this.graphQLExecutor = new GraphQLExecutor(schema, contextFactory);

		const {
			showGraphiQL,
			introspection = process.env.NODE_ENV !== 'production',
			validationRules = [],
		} = opts;

		this.showGraphiQL = introspection && (showGraphiQL ?? process.env.NODE_ENV !== 'production');
		this.validationRules = introspection
			? [...specifiedRules, ...validationRules]
			: [disableIntrospectionRule, ...specifiedRules, ...validationRules];
	}

	public async handle(req: Request, res: ServerResponse): Promise<void> {
		let result: ExecutionResult;
		try {
			// GraphQL HTTP only supports GET and POST methods.
			if (req.method !== 'GET' && req.method !== 'POST') {
				throw httpError(405, 'GraphQL only supports GET and POST requests.', {
					headers: { Allow: 'GET, POST' },
				});
			}

			const params = await this.requestParser.parse(req);

			const { query, variables, operationName } = params;

			if (query == null) {
				if (this.canDisplayGraphiQL(req, params)) {
					this.respondWithGraphiQL(res);
					return;
				}
				throw httpError(400, 'Must provide query string.');
			}

			result = await this.graphQLExecutor.execute(req.$ctx, query, variables, operationName, {
				validationRules: this.validationRules,
			});
		} catch (rawError: unknown) {
			// If an error was caught, report the httpError status, or 500.
			const error = httpError(500, rawError instanceof Error ? rawError : String(rawError));

			res.statusCode = error.status;

			const { headers } = error;
			if (headers != null) {
				Object.entries(headers).forEach(([key, value]) => {
					res.setHeader(key, String(value));
				});
			}

			if (error.graphqlErrors == null) {
				const graphqlError = new GraphQLError(
					error.message,
					undefined,
					undefined,
					undefined,
					undefined,
					error,
				);
				result = { data: undefined, errors: [graphqlError] };
			} else {
				result = { data: undefined, errors: error.graphqlErrors };
			}
		}

		if (res.statusCode === 200 && result.data == null) {
			res.statusCode = 500;
		}

		// Format any encountered errors.
		const formattedResult: FormattedExecutionResult = {
			...result,
			errors: result.errors?.map(formatError),
		};

		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(formattedResult));
	}

	/**
	 * Helper function to determine if GraphiQL can be displayed.
	 */
	private canDisplayGraphiQL(request: Request, params: GraphQLParams): boolean {
		// If `raw` false, GraphiQL mode is not enabled.
		// Allowed to show GraphiQL if not requested as raw and this request prefers HTML over JSON.
		return this.showGraphiQL && !params.raw && accepts(request).types(['json', 'html']) === 'html';
	}

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
