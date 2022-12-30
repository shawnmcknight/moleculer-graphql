import {
	GraphQLError,
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
	parse,
	validate,
} from 'graphql';
import disableIntrospectionRule from '../disableIntrospectionRule';

const schema = new GraphQLSchema({
	query: new GraphQLObjectType({
		name: 'RootQueryType',
		fields: {
			hello: {
				type: GraphQLString,
				resolve() {
					return 'world';
				},
			},
		},
	}),
});

test('should return GraphQLError if introspection query containing __schema', () => {
	const query = /* GraphQL */ `
		query {
			__schema {
				types {
					name
				}
			}
		}
	`;
	const document = parse(query);

	const errors = validate(schema, document, [disableIntrospectionRule]);

	expect(errors).toHaveLength(1);
	expect(errors[0]).toBeInstanceOf(GraphQLError);
	expect(errors[0].message).toBe(
		'GraphQL introspection is not allowed, but the query contained __schema or __type',
	);
});

test('should return GraphQLError if introspection query containing __type', () => {
	const query = /* GraphQL */ `
		query {
			__type(name: "Foo") {
				name
			}
		}
	`;
	const document = parse(query);

	const errors = validate(schema, document, [disableIntrospectionRule]);

	expect(errors).toHaveLength(1);
	expect(errors[0]).toBeInstanceOf(GraphQLError);
	expect(errors[0].message).toBe(
		'GraphQL introspection is not allowed, but the query contained __schema or __type',
	);
});

test('should not return GraphQLError if not introspection query', () => {
	const query = /* GraphQL */ `
		query {
			hello
		}
	`;
	const document = parse(query);

	const errors = validate(schema, document, [disableIntrospectionRule]);

	expect(errors).toHaveLength(0);
});
