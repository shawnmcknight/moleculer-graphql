import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import { defaultFieldResolver } from 'graphql';
import type { DirectiveFactoryResult } from '../types';

const upperDirectiveFactory = (directiveName: string): DirectiveFactoryResult => ({
	typeDefs: /* GraphQL */ `directive @${directiveName} on FIELD_DEFINITION`,
	transformer: (schema) =>
		mapSchema(schema, {
			[MapperKind.OBJECT_FIELD]: (fieldConfig) => {
				const upperDirective = getDirective(schema, fieldConfig, directiveName)?.[0];

				if (upperDirective == null) {
					return undefined;
				}

				const { resolve = defaultFieldResolver } = fieldConfig;
				// eslint-disable-next-line no-param-reassign
				fieldConfig.resolve = async (source, args, context, info) => {
					const result = await resolve(source, args, context, info);
					return typeof result === 'string' ? result.toUpperCase() : result;
				};
				return fieldConfig;
			},
		}),
});

export default upperDirectiveFactory;
