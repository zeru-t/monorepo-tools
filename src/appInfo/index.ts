import { Uri, workspace, TextDocument as VSCodeTextDocument } from 'vscode';
import { project, packageFile } from '../models';
import { readFileSync } from 'fs';


class AppInfo {

	public projects: project[];

	public get IsMonorepo() { return this.projects.length > 1; }

	constructor(projects: project[]) {
		this.projects = projects;
	}

	public static async create() {
		const projects = await getProjects();
		return new AppInfo(projects);
	}

	public async refresh() {
		this.projects = await getProjects();
	}
}

async function getProjects() {

	const root = workspace.workspaceFolders![0].uri.path!;

	const packageFilePaths = await workspace.findFiles('**/package.json', '{**/node_modules/**,**/.*}');
	const packagesFiles = await Promise.all(
		packageFilePaths
			.filter(({ path }) => path !== `${root}/package.json`)
			.map(async (uri) => {
				const doc = await TextDocument.open(uri);
				const docText = await doc.getText();
				return {
					...JSON.parse(docText),
					path: doc.path,
					fsPath: uri.fsPath
				} as packageFile;
			})
	);

	const projectNames = packagesFiles.map(({ name }) => name);
	const isProjectDependency = (dependency: string) => projectNames.includes(dependency);

	return packagesFiles
		.map<project>(({ path, fsPath, name: packageName, dependencies, devDependencies }) => {
			const regex = new RegExp('(/)?package.json', 'g');
			const [folder, projectName] = path.replace(`${root}/`, '').replace(regex, '').split('/');
			return {
				path: fsPath,
				folder,
				projectName,
				packageName,
				dependencies: Object.keys(dependencies ?? {}).filter(isProjectDependency),
				devDependencies: Object.keys(devDependencies ?? {}).filter(isProjectDependency)
			};
		})
		.sort((a, b) => {
			if (a.folder === b.folder)
				return a.projectName < b.projectName ? -1 : 1;
			return a.folder < b.folder ? -1 : 1;
		});
}

class TextDocument {

	private _doc: VSCodeTextDocument;
	private _getSavedText: (input?: NodeJS.ArrayBufferView<ArrayBufferLike>) => string;

	private get _uri() { return this._doc.uri; }

	public get path() { return this._uri.path; }

	constructor(doc: VSCodeTextDocument) {
		this._doc = doc;
		const textDecoder = new TextDecoder();
		this._getSavedText = () => textDecoder.decode(readFileSync(this._uri.fsPath));
	}

	public static async open(uri: Uri) {
		return new TextDocument(await workspace.openTextDocument(uri.path));
	}

	public async getText() {
		if (this._doc.isDirty)
			return this._getSavedText();
		return this._doc.getText();
	}
}

export { AppInfo };
