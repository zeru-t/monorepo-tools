interface packageFile {
	path: string;
	name: string;
	dependencies: Record<string, string>;
	devDependencies: Record<string, string>;
}

export { packageFile };
