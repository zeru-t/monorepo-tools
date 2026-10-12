type Annotation = Record<string, string>;

interface Settings {
	annotations: Annotation;
	hideAnnotations: boolean;
	packageManager: string;
	runScript: string;
	buildScript: string;
}

export { Settings };
