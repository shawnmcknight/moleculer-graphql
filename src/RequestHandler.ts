import fs from 'fs';
import type { ServerResponse } from 'http';
import path from 'path';
import accepts from 'accepts';
import httpError from 'http-errors';
import type { Request, GraphQLParams } from './RequestParser';
import RequestParser from './RequestParser';

interface RequestHandlerOptions {
	showGraphiQL?: boolean;
}

class RequestHandler {
	private requestParser: RequestParser = new RequestParser();

	private playgroundPath = path.join(__dirname, 'playground.html');

	private playgroundStat = fs.statSync(this.playgroundPath);

	private showGraphiQL: boolean;

	public constructor(opts: RequestHandlerOptions = {}) {
		const { showGraphiQL = false } = opts;
		this.showGraphiQL = showGraphiQL;
	}

	public async handle(req: Request, res: ServerResponse): Promise<void> {
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
				return this.respondWithGraphiQL(res);
			}
			throw httpError(400, 'Must provide query string.');
		}

		return res.end();
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
