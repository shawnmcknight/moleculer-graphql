export module 'moleculer' {
	export interface GraphQLActionSchema {
		query?: string | readonly string[];
		mutation?: string | readonly string[];
	}

	export interface ActionSchema {
		graphql?: GraphQLActionSchema;
	}
}
