type annotation = Record<string, string>;

interface settings {
	annotations: annotation;
	hideAnnotations: boolean;
	packageManager: string;
	runScript: string;
	buildScript: string;
}

export { settings };
