interface project {
	projectName: string;
	path: string;
	folder: string;
	packageName: string;
	dependencies: string[];
	devDependencies: string[];
}

type projects = project[];

export { project, projects };
