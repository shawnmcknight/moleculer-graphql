import { mock } from 'jest-mock-extended';
import type { Context } from 'moleculer';
import GraphQLContextCreator from '../GraphQLContextCreator';

const contextMock = mock<Context>();

test('should return a context object with only moleculer context', async () => {
	const graphQLContextCreator = new GraphQLContextCreator();

	const expected = {
		$ctx: contextMock,
	};
	expect(await graphQLContextCreator.createGraphQLContext(contextMock)).toEqual(expected);
});

test('should return a context object which includes the properties from the context factory', async () => {
	const contextFactory = async () => Promise.resolve({ foo: 'foo', bar: 'bar' });
	const graphQLContextCreator = new GraphQLContextCreator(contextFactory);

	const expected = {
		foo: 'foo',
		bar: 'bar',
		$ctx: contextMock,
	};
	expect(await graphQLContextCreator.createGraphQLContext(contextMock)).toEqual(expected);
});
