export interface Author {
	id: string;
	name: string;
}

export interface AuthorByIdParams {
	id: string;
}
export type AuthorByIdResult = Author | null;

export interface AuthorsByIdParams {
	ids: string[];
}
export type AuthorsByIdResult = (Author | null)[];

export interface AuthorCreate {
	name: string;
}
export interface AuthorCreateParams {
	author: AuthorCreate;
}
export type AuthorCreateResult = Author;
