import type { ServerResponse } from 'http';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { createHandler } from 'graphql-http';
import { mock } from 'jest-mock-extended';
import type { IncomingRequest } from 'moleculer-web';
import RequestHandler from '../RequestHandler';

jest.mock('graphql-http');

const schema = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'RootQueryType',
		fields: {
			hello: {
				type: GraphQLString,
				resolve() {
					return 'Hello world';
				},
			},
		},
	}),
});

const handler = jest.fn();

beforeEach(() => {
	(createHandler as jest.Mock).mockReturnValue(handler);
});

describe('errors', () => {
	test('should respond with 500 if request url is undefined', async () => {
		const requestHandler = new RequestHandler(schema, jest.fn());

		const requestMock = mock<IncomingRequest>();
		requestMock.url = undefined;
		const responseMock = mock<ServerResponse>();
		responseMock.writeHead.mockReturnValue(responseMock);

		await requestHandler.handle(requestMock, responseMock);

		expect(responseMock.writeHead).toHaveBeenCalledWith(500, 'Missing request URL');
		expect(responseMock.end).toHaveBeenCalledTimes(1);
	});

	test('should respond with 500 if request method is undefined', async () => {
		const requestHandler = new RequestHandler(schema, jest.fn());

		const requestMock = mock<IncomingRequest>();
		requestMock.method = undefined;
		const responseMock = mock<ServerResponse>();
		responseMock.writeHead.mockReturnValue(responseMock);

		await requestHandler.handle(requestMock, responseMock);

		expect(responseMock.writeHead).toHaveBeenCalledWith(500, 'Missing request method');
		expect(responseMock.end).toHaveBeenCalledTimes(1);
	});
});

describe('graphiql', () => {
	test('should respond with graphiql if introspection and showGraphiQL are both true', async () => {
		const requestHandler = new RequestHandler(schema, jest.fn(), {
			showGraphiQL: true,
			introspection: true,
		});

		const requestMock = mock<IncomingRequest>();
		requestMock.method = 'GET';
		requestMock.query = {};
		requestMock.headers = { accept: 'text/html' };
		const responseMock = mock<ServerResponse>();

		await requestHandler.handle(requestMock, responseMock);

		expect(responseMock.writeHead).toHaveBeenCalledWith(
			200,
			expect.objectContaining({
				'Content-Type': 'text/html',
				'Content-Length': expect.any(Number),
			}),
		);
	});

	test('should not respond with graphiql if introspection is false', async () => {
		const requestHandler = new RequestHandler(schema, jest.fn(), {
			showGraphiQL: true,
			introspection: false,
		});

		const requestMock = mock<IncomingRequest>();
		const responseMock = mock<ServerResponse>();
		responseMock.writeHead.mockReturnValue(responseMock);

		handler.mockResolvedValue([
			'body',
			{
				status: 500,
				statusText: 'Internal Server Error',
				headers: { 'Content-Type': 'text/html' },
			},
		]);

		await requestHandler.handle(requestMock, responseMock);

		expect(responseMock.writeHead).not.toHaveBeenCalledWith(
			200,
			expect.objectContaining({
				'Content-Type': 'text/html',
				'Content-Length': expect.any(Number),
			}),
		);
	});

	test('should not respond with graphiql if showGraphiQL is false', async () => {
		const requestHandler = new RequestHandler(schema, jest.fn(), {
			showGraphiQL: false,
			introspection: true,
		});

		const requestMock = mock<IncomingRequest>();
		const responseMock = mock<ServerResponse>();
		responseMock.writeHead.mockReturnValue(responseMock);

		handler.mockResolvedValue([
			'body',
			{
				status: 500,
				statusText: 'Internal Server Error',
				headers: { 'Content-Type': 'text/html' },
			},
		]);

		await requestHandler.handle(requestMock, responseMock);

		expect(responseMock.writeHead).not.toHaveBeenCalledWith(
			200,
			expect.objectContaining({
				'Content-Type': 'text/html',
				'Content-Length': expect.any(Number),
			}),
		);
	});
});

describe('graphql handling', () => {
	test('should handle valid graphql request', async () => {
		const requestHandler = new RequestHandler(schema, jest.fn());

		const requestMock = mock<IncomingRequest>();
		const responseMock = mock<ServerResponse>();
		responseMock.writeHead.mockReturnValue(responseMock);

		handler.mockResolvedValue([
			'body',
			{ status: 200, statusText: 'OK', headers: { 'Content-Type': 'text/html' } },
		]);

		await requestHandler.handle(requestMock, responseMock);

		expect(responseMock.writeHead).toHaveBeenCalledWith(200, 'OK', { 'Content-Type': 'text/html' });
		expect(responseMock.end).toHaveBeenCalledWith('body');

		expect(handler).toHaveBeenCalledWith(
			expect.objectContaining({
				url: requestMock.url,
				method: requestMock.method,
				headers: requestMock.headers,
				raw: requestMock,
			}),
		);
	});
});
