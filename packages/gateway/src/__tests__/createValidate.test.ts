import { GraphQLError, GraphQLObjectType, GraphQLSchema, GraphQLString, parse } from 'graphql';
import type { ValidationContext, ValidationRule } from 'graphql';
import createValidate from '../createValidate';

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

describe('introspection disabled', () => {
	const validateFn = createValidate({ introspection: false });

	test('should return GraphQLError if query contains __schema', () => {
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

		const errors = validateFn(schema, document);
		expect(errors).toHaveLength(1);
		expect(errors[0]).toBeInstanceOf(GraphQLError);
		expect(errors[0].message).toBe(
			'GraphQL introspection is not allowed, but the query contained __schema or __type',
		);
	});

	test('should return GraphQLError if query contains __type', () => {
		const query = /* GraphQL */ `
			query {
				__type(name: "Foo") {
					name
				}
			}
		`;
		const document = parse(query);

		const errors = validateFn(schema, document);
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

		const errors = validateFn(schema, document);
		expect(errors).toHaveLength(0);
	});
});

describe('introspection enabled', () => {
	const validateFn = createValidate();

	test('should not return GraphQLError if query contains __schema', () => {
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

		const errors = validateFn(schema, document);
		expect(errors).toHaveLength(0);
	});

	test('should not return GraphQLError if query contains __type', () => {
		const query = /* GraphQL */ `
			query {
				__type(name: "Foo") {
					name
				}
			}
		`;
		const document = parse(query);

		const errors = validateFn(schema, document);
		expect(errors).toHaveLength(0);
	});

	test('should not return GraphQLError if not introspection query', () => {
		const query = /* GraphQL */ `
			query {
				hello
			}
		`;
		const document = parse(query);

		const errors = validateFn(schema, document);
		expect(errors).toHaveLength(0);
	});
});

describe('custom rules', () => {
	test('should return errors reported by custom rule', () => {
		const customRule: ValidationRule = (context: ValidationContext) => ({
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Field(node) {
				context.reportError(new GraphQLError('Custom rule failure', { nodes: [node] }));
			},
		});

		const validateFn = createValidate({ validationRules: [customRule] });

		const query = /* GraphQL */ `
			query {
				hello
			}
		`;
		const document = parse(query);

		const errors = validateFn(schema, document);
		expect(errors).toHaveLength(1);
		expect(errors[0]).toBeInstanceOf(GraphQLError);
		expect(errors[0].message).toBe('Custom rule failure');
	});
});
