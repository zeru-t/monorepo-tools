import { ExtensionContext, IconPath, QuickPickItem, QuickPickItemKind, QuickPick as VSCodeQuickPick, Uri, workspace } from 'vscode';

import { packageSearchResult, project, projects } from '../models';

import '../extensions';

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

	constructor({ extensionPath, workspaceState }: ExtensionContext, project: project, root: boolean, id: number, last: boolean, skipDescription = false) {
		const currentProject = workspaceState.get<string>('project');

		const { projectName } = this.project = project;

		this.id = id;
		this.label = `${root ? '' : `  ${last ? '└─' : '├─'}📁 `}${projectName}`;

		if (root) {
			this.iconPath = Uri.file(`${extensionPath}/icons/project.svg`);
			if (!skipDescription)
				this.description = 'Install All Packages';
		}

		if (currentProject === projectName) {
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
	public static create(extensionContext: ExtensionContext, folder: string, projects: projects) {
		return [
			new QuickPickItemSeparator(`🗃️ ${folder}`),
			...projects.map((project, index) => new ProjectQuickPickItem(extensionContext, project, false, index, index === projects.length - 1))
		] as BaseQuickPickItem[];
	}
	public static createItems(extensionContext: ExtensionContext, projects: projects) {
		return [
			...ProjectQuickPickItems.createRoot(extensionContext),
			...Object.entries(Object.groupBy(projects, ({ folder }) => folder))
				.flatMap(([folder, projects]) => ProjectQuickPickItems.create(extensionContext, folder, projects!))
		] as BaseQuickPickItem[];
	}
	public static createRoot(extensionContext: ExtensionContext) {
		const rootProject = { projectName: workspace.name! } as project;
		return [
			new QuickPickItemSeparator('🌐'),
			new ProjectQuickPickItem(extensionContext, rootProject, true, -1, false)
		] as BaseQuickPickItem[];
	}
	public static createForSingleRepo(extensionContext: ExtensionContext) {
		const workspaceName = workspace.name!;
		return [
			new QuickPickItemSeparator('🌐'),
			new ProjectQuickPickItem(extensionContext, { projectName: 'Install All Packages' } as project, true, -1, false, true),
			new QuickPickItemSeparator(`🗃️ ${workspaceName}`),
			new ProjectQuickPickItem(extensionContext, { projectName: workspaceName } as project, true, 1, true, true)
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
