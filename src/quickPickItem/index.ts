import { ExtensionContext, IconPath, QuickPickItem, QuickPickItemKind, QuickPick as VSCodeQuickPick, Uri, workspace } from 'vscode';

import { packageSearchResult, project, projects, undefinable } from '../models';


class BaseQuickPickItem implements QuickPickItem {
	public label = '';
	public kind?: QuickPickItemKind = QuickPickItemKind.Default;
	public description?: string;
	public detail?: string;
	public iconPath?: IconPath;
	public alwaysShow?: boolean;

	public id?: number;
	public active?: boolean;
}
class ProjectQuickPickItem implements BaseQuickPickItem {

	public label: string;
	public description?: string;
	public iconPath?: IconPath;
	public alwaysShow?: boolean;

	public id?: number;
	public project?: project;
	public active?: boolean;

	constructor(extensionPath: string, currentProject: undefinable<string>, project: project, root: boolean, id: number, last: boolean, skipDescription = false) {
		const { projectName } = this.project = project;

		this.id = id;
		this.label = `${root ? '' : `  ${last ? '└─' : '├─'}📁 `}${projectName}`;

		if (root) {
			this.iconPath = Uri.file(`${extensionPath}/icons/project.svg`);
			if (!skipDescription)
				this.description = 'Install All Packages';
		}

		if (projectName === currentProject) {
			this.active = true;
			this.description = '\t(active project)';
		}
	}
}
class PackageQuickPickItem implements BaseQuickPickItem {
	public label: string;
	public description?: string;
	public detail?: string;

	public id?: number;

	constructor(result: packageSearchResult) {
		this.label = result.sanitized_name;
		this.detail = `${result.description}`;
		this.description = `v${result.version} $(cloud-download)`;
	}
}
class QuickPickItemSeparator implements BaseQuickPickItem {
	constructor(public label: string, public kind = QuickPickItemKind.Separator) { }
}

class ProjectQuickPickItems {
	public static create({ extensionPath }: ExtensionContext, currentProject: undefinable<string>, folder: string, projects: projects) {
		return [
			new QuickPickItemSeparator(`🗃️ ${folder}`),
			...projects.map((project, index) => new ProjectQuickPickItem(extensionPath, currentProject, project, false, index, index === projects.length - 1))
		] as BaseQuickPickItem[];
	}
	public static createItems(extensionContext: ExtensionContext, currentProject: undefinable<string>, projects: projects) {
		return [
			...ProjectQuickPickItems.createRoot(extensionContext, currentProject),
			...Object.entries(Object.groupBy(projects, ({ folder }) => folder))
				.flatMap(([folder, projects]) => ProjectQuickPickItems.create(extensionContext, currentProject, folder, projects!))
		] as BaseQuickPickItem[];
	}
	public static createRoot(extensionContext: ExtensionContext, currentProject: undefinable<string>) {
		const rootProject = { projectName: workspace.name! } as project;
		return [
			new QuickPickItemSeparator('🌐'),
			new ProjectQuickPickItem(extensionContext.extensionPath, currentProject, rootProject, true, -1, false)
		] as BaseQuickPickItem[];
	}
	public static createForSingleRepo(extensionContext: ExtensionContext, currentProject: undefinable<string>) {
		const workspaceName = workspace.name!;
		return [
			new QuickPickItemSeparator('🌐'),
			new ProjectQuickPickItem(extensionContext.extensionPath, currentProject, { projectName: 'Install All Packages' } as project, true, -1, false, true),
			new QuickPickItemSeparator(`🗃️ ${workspaceName}`),
			new ProjectQuickPickItem(extensionContext.extensionPath, currentProject, { projectName: workspaceName } as project, true, 1, true, true)
		] as BaseQuickPickItem[];
	}
}

interface QuickPick extends VSCodeQuickPick<BaseQuickPickItem> {
	project: project;
	packageName: string;
	debounce: QuickPickDebounce;
}
interface QuickPickDebounce {
	id: number;
	timeout: NodeJS.Timeout;
}

enum QuickPickSteps {
	ProjectSelection = 1,
	PackageSearch = 2,
	InstallTypeSelection = 3
}

export { BaseQuickPickItem, ProjectQuickPickItem, PackageQuickPickItem, QuickPickItemSeparator, ProjectQuickPickItems, QuickPick, QuickPickSteps };
