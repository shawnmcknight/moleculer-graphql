export {
	default as serviceMixin,
	type GraphQLRequest,
	type GraphQLServiceSettings,
	type ResolversFactory,
	type ServiceMixinOptions,
	type TypeDefsFactory,
} from './serviceMixin';

declare module 'moleculer' {
	export interface GraphQLActionSchema {
		query?: string | readonly string[];
		mutation?: string | readonly string[];
	}

	export interface ActionSchema {
		graphql?: GraphQLActionSchema;
	}
}
