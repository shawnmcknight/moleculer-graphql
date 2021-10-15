export default function buildFullActionName(
	serviceName: string,
	actionName: string,
	version?: string | number,
): string {
	const prefix = version != null ? `v${version}.` : '';

	return `${prefix}${serviceName}.${actionName}`;
}
