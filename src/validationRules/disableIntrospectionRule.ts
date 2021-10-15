import type { ValidationContext, ValidationRule } from 'graphql';
import { GraphQLError } from 'graphql';

const disableIntrospectionRule: ValidationRule = (context: ValidationContext) => ({
	Field(node) {
		if (node.name.value === '__schema' || node.name.value === '__type') {
			context.reportError(
				new GraphQLError(
					'GraphQL introspection is not allowed, but the query contained __schema or __type',
					[node],
				),
			);
		}
	},
});

export default disableIntrospectionRule;
