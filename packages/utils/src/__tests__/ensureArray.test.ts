import ensureArray from '../ensureArray';

test('should return an array if passed an array', () => {
	expect(ensureArray(['foo', 'bar'])).toEqual(['foo', 'bar']);
});

test('should return an empty array if no value passed', () => {
	expect(ensureArray()).toEqual([]);
});

test('should return an array of the primitive if a primitive value is passed', () => {
	expect(ensureArray('foo')).toEqual(['foo']);
});
