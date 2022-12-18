const ensureArray = <T>(value?: T | readonly T[]): T[] => {
	if (Array.isArray(value)) {
		return [...value];
	}

	if (typeof value === 'undefined') {
		return [];
	}

	// TODO: This cast is needed until Array.isArray can narrow readonly arrays correctly
	// https://github.com/microsoft/TypeScript/issues/17002
	return [value as T];
};

export default ensureArray;
