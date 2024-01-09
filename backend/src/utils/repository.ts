export type RepoGetOptionsInclude<T> = {
	[K in keyof T]?: true;
};

export type RepoGetOptions<T> = {
	include?: RepoGetOptionsInclude<T>;
};

export type RepoGetIncludedProperties<
	T,
	O extends RepoGetOptions<T>,
> = O["include"] extends RepoGetOptionsInclude<T>
	? {
			[K in keyof O["include"]]: K extends keyof T ? T[K] : never;
	  }
	: {};
