import type { DocumentNode, GraphQLSchema, ValidationRule } from 'graphql';
import { specifiedRules, validate } from 'graphql';
import { disableIntrospectionRule } from './validationRules';

interface MakeValidateOptions {
	/** Allow introspection queries */
	introspection?: boolean;
	/** Additional validation rules */
	validationRules?: readonly ValidationRule[];
}

/** Create a GraphQL validation function which includes custom validation rules */
const createValidate = (opts: MakeValidateOptions = {}): typeof validate => {
	const { introspection = process.env.NODE_ENV !== 'production', validationRules = [] } = opts;

	const fullValidationRules = introspection
		? [...specifiedRules, ...validationRules]
		: [disableIntrospectionRule, ...specifiedRules, ...validationRules];

	return (schema: GraphQLSchema, documentAST: DocumentNode) =>
		validate(schema, documentAST, fullValidationRules);
};

export default createValidate;
