import type { ActionCatalogActionSchema } from 'moleculer';

declare module 'moleculer' {
	export interface GraphQLActionSchema {
		query?: string | readonly string[];
		mutation?: string | readonly string[];
	}

	export interface ActionCatalogActionSchema {
		graphql?: GraphQLActionSchema;
	}
}
