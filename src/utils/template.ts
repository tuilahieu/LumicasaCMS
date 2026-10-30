export type TemplateVariables = Record<string, string | number>;

const TOKEN_PATTERN = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

export function renderTemplate(
	template: string,
	variables: TemplateVariables,
): string {
	return template.replace(TOKEN_PATTERN, (token, key: string) => {
		const value = variables[key];
		return value === undefined ? token : String(value);
	});
}
