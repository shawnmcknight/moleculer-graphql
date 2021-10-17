export interface Post {
	id: string;
	authorId: string;
	message: string;
}

export interface PostAuthor {
	id: string;
}

export interface PostByIdParams {
	id: string;
}
export type PostByIdResult = Post | null;

export interface PostsByIdParams {
	ids: string[];
}
export type PostsByIdResult = (Post | null)[];

export interface PostCreate {
	authorId: string;
	message: string;
}
export interface PostCreateParams {
	post: PostCreate;
}
export type PostCreateResult = Post;
