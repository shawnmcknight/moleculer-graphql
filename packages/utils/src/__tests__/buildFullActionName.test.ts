import buildFullActionName from '../buildFullActionName';

test('should construct an action name without a version', () => {
	const serviceName = 'testService';
	const actionName = 'testAction';

	const expected = 'testService.testAction';

	expect(buildFullActionName(serviceName, actionName)).toBe(expected);
});

test('should construct an action name with a numbered version', () => {
	const serviceName = 'testService';
	const actionName = 'testAction';
	const version = 2;

	const expected = 'v2.testService.testAction';

	expect(buildFullActionName(serviceName, actionName, version)).toBe(expected);
});

test('should construct an action name with a string version', () => {
	const serviceName = 'testService';
	const actionName = 'testAction';
	const version = '3';

	const expected = 'v3.testService.testAction';

	expect(buildFullActionName(serviceName, actionName, version)).toBe(expected);
});
