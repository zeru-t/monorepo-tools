import { workspace } from 'vscode';
import { appInfo, packageFile } from '../models';


class AppInfo {

	public appInfo: appInfo[];

	constructor(appInfo: appInfo[]) {
		this.appInfo = appInfo;
	}

	public static async create() {
		const appInfo = await getAppInfo();
		return new AppInfo(appInfo);
	}

	public async refresh() {
		this.appInfo = await getAppInfo();
	}
}

async function getAppInfo() {

	const root = workspace.workspaceFolders![0].uri.path!;

	const packageFilePaths = await workspace.findFiles('**/package.json', '{**/node_modules/**,**/.*}');
	const packagesFiles = await Promise.all(
		packageFilePaths
			.filter(({ path }) => path !== `${root}/package.json`)
			.map(async ({ path }) => {
				const doc = await workspace.openTextDocument(path);
				return {
					...JSON.parse(doc.getText()),
					path: doc.uri.path
				} as packageFile;
			})
	);

	const packageNames = packagesFiles.map(({ name }) => name);
	const isAppDependency = (dep: string) => packageNames.includes(dep);

	return packagesFiles
		.map<appInfo>(({ path, name: packageName, dependencies, devDependencies }) => {
			const regex = new RegExp('(/)?package.json', 'g');
			const [folder, appName] = path.replace(`${root}/`, '').replace(regex, '').split('/');
			return {
				folder,
				appName,
				packageName,
				dependencies: Object.keys(dependencies ?? {}).filter(isAppDependency),
				devDependencies: Object.keys(devDependencies ?? {}).filter(isAppDependency)
			};
		})
		.sort((a, b) => {
			if (a.folder === b.folder)
				return a.appName < b.appName ? -1 : 1;
			return a.folder < b.folder ? -1 : 1;
		});
}


export { AppInfo };
