import type { IncomingMessage } from 'http';
import querystring from 'querystring';
import { URLSearchParams } from 'url';
import type { Gunzip, Inflate } from 'zlib';
import zlib from 'zlib';
import type { ParsedMediaType } from 'content-type';
import contentType from 'content-type';
import getStream, { MaxBufferError } from 'get-stream';
import httpError from 'http-errors';

export interface GraphQLParams {
	query: string | null;
	variables: Readonly<Record<string, unknown>> | null;
	operationName: string | null;
	raw: boolean;
}

export type Request = IncomingMessage & { url: string; body?: unknown };

/**
 * RegExp to match an Object-opening brace "{" as the first non-space
 * in a string. Allowed whitespace is defined in RFC 7159:
 *
 *     ' '   Space
 *     '\t'  Horizontal tab
 *     '\n'  Line feed or New line
 *     '\r'  Carriage return
 */
const jsonObjRegex = /^[ \t\n\r]*\{/;

class RequestParser {
	public async parse(req: Request): Promise<GraphQLParams> {
		const urlData = new URLSearchParams(req.url.split('?')[1]);
		const bodyData = await this.parseBody(req);

		let query = urlData.get('query') ?? (bodyData.query as string | null);
		if (typeof query !== 'string') {
			query = null;
		}

		let variables = (urlData.get('variables') ?? bodyData.variables) as Readonly<
			Record<string, unknown>
		> | null;
		if (typeof variables === 'string') {
			try {
				variables = JSON.parse(variables);
			} catch {
				throw new Error('Variables are invalid JSON');
			}
		} else if (typeof variables !== 'object') {
			variables = null;
		}

		// Name of GraphQL operation to execute.
		let operationName = urlData.get('operationName') ?? (bodyData.operationName as string | null);
		if (typeof operationName !== 'string') {
			operationName = null;
		}

		const raw = urlData.get('raw') != null || bodyData.raw !== undefined;

		return { query, variables, operationName, raw };
	}

	private async parseBody(req: Request): Promise<Record<string, unknown>> {
		const { body } = req;

		// If the body has already been parsed as a keyed object, use it.
		if (typeof body === 'object' && !(body instanceof Buffer)) {
			return body as Record<string, unknown>;
		}

		// Skip requests without content types.
		if (req.headers['content-type'] === undefined) {
			return {};
		}

		const typeInfo = contentType.parse(req);

		// If express has already parsed a body as a string, and the content-type
		// was application/graphql, parse the string body.
		if (typeof body === 'string' && typeInfo.type === 'application/graphql') {
			return { query: body };
		}

		// Already parsed body we didn't recognise? Parse nothing.
		if (body != null) {
			return {};
		}

		const rawBody = await this.readBody(req, typeInfo);
		// Use the correct body parser based on Content-Type header.
		switch (typeInfo.type) {
			case 'application/graphql':
				return { query: rawBody };
			case 'application/json':
				if (jsonObjRegex.test(rawBody)) {
					try {
						return JSON.parse(rawBody);
					} catch {
						// Do nothing
					}
				}
				throw httpError(400, 'POST body sent invalid JSON.');
			case 'application/x-www-form-urlencoded':
				return querystring.parse(rawBody);
			default:
				return {};
		}
	}

	private async readBody(req: Request, typeInfo: ParsedMediaType): Promise<string> {
		const charset = typeInfo.parameters.charset?.toLowerCase() ?? 'utf-8';

		// Assert charset encoding per JSON RFC 7159 sec 8.1
		if (charset !== 'utf8' && charset !== 'utf-8' && charset !== 'utf16le') {
			throw httpError(415, `Unsupported charset "${charset.toUpperCase()}".`);
		}

		// Get content-encoding (e.g. gzip)
		const contentEncoding = req.headers['content-encoding'];
		const encoding =
			typeof contentEncoding === 'string' ? contentEncoding.toLowerCase() : 'identity';
		const maxBuffer = 100 * 1024; // 100kb
		const stream = this.decompressed(req, encoding);

		// Read body from stream.
		try {
			const buffer = await getStream.buffer(stream, { maxBuffer });
			return buffer.toString(charset);
		} catch (rawError: unknown) {
			/* istanbul ignore else: Thrown by underlying library. */
			if (rawError instanceof MaxBufferError) {
				throw httpError(413, 'Invalid body: request entity too large.');
			} else {
				const message = rawError instanceof Error ? rawError.message : String(rawError);
				throw httpError(400, `Invalid body: ${message}.`);
			}
		}
	}

	private decompressed(req: Request, encoding: string): Request | Inflate | Gunzip {
		switch (encoding) {
			case 'identity':
				return req;
			case 'deflate':
				return req.pipe(zlib.createInflate());
			case 'gzip':
				return req.pipe(zlib.createGunzip());
			default:
				throw httpError(415, `Unsupported content-encoding "${encoding}".`);
		}
	}
}

export default RequestParser;
