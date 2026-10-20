import { TreeItemCollapsibleState, TreeDataProvider, TreeItem as VSCodeTreeItem, EventEmitter, Event, ExtensionContext, Uri } from 'vscode';

import { AppInfo } from '../appInfo';
import { optional, project, treeItemProps } from '../models';


type ChangeTreeData = optional<TreeItem>;

class DependencyTreeDataProvider implements TreeDataProvider<TreeItem> {

	private _extensionPath: string;
	private _appInfo: AppInfo;
	private _onDidChangeTreeData = new EventEmitter<ChangeTreeData>();

	public TreeItems: TreeItem[];

	readonly onDidChangeTreeData: Event<ChangeTreeData>;

	constructor({ extensionPath }: ExtensionContext, appInfo: AppInfo) {
		this._extensionPath = extensionPath;
		this._appInfo = appInfo;

		this.TreeItems = this.getTreeItems();

		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
	}

	public getTreeItems() {
		return this._appInfo.projects
			.map(({ folder }) => folder)
			.unique()
			.map(folder => new TreeItem({ projects: this._appInfo.projects, extensionPath: this._extensionPath, label: folder, collapsible: true }));
	}

	public getTreeItem(element: TreeItem) {
		return element;
	}

	public getChildren(element?: TreeItem) {
		return element ? element.children : this.TreeItems;
	}

	public getParent(element: TreeItem) {
		return element?.parent;
	}

	public refresh() {
		return async () => {
			await this._appInfo.refresh();
			this.TreeItems = this.getTreeItems();
			this._onDidChangeTreeData.fire();
		};
	}
}

class TreeItem extends VSCodeTreeItem {
	public id: string;
	public path = '';
	public children?: TreeItem[];
	public parent?: TreeItem;

	public project?: project;

	constructor({ projects, extensionPath, label, path, collapsible, tooltip, icon, description, project }: treeItemProps, parent?: TreeItem) {
		super(label, collapsible ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);

		this.id = label;

		this.tooltip = tooltip;
		this.description = description;

		this.project = project;

		this.iconPath = Uri.file(`${extensionPath}/icons/${icon ?? 'folder'}.svg`);

		if (path) {
			this.path = path;
			this.contextValue = 'project';
		}

		this.children = [];
		this.parent = parent;

		const projectFolders = projects.filter(({ folder }) => folder === label);
		if (projectFolders.length) {
			this.children = projectFolders
				.map((project) => {
					const { appName, path, dependencies, devDependencies } = project;
					const allDependencies = [...dependencies, ...devDependencies];
					const hasDeps = !!allDependencies.length;
					return new TreeItem({
						project,
						projects,
						extensionPath,
						path,
						label: appName,
						collapsible: hasDeps,
						description: hasDeps ? undefined : 'n/a',
						icon: 'project'
					}, this);
				});
		}

		const treeItemProject = projects.find(({ appName }) => appName === label);
		if (treeItemProject) {
			const { dependencies, devDependencies } = treeItemProject;
			this.children = [
				...dependencies.map(dependency => {
					const { appName } = projects.find(app => app.packageName === dependency)!;
					return new TreeItem({
						projects,
						extensionPath,
						label: appName,
						tooltip: 'dependency',
						icon: 'dependency'
					}, this);
				}),
				...devDependencies.map(devDependency => {
					const { appName } = projects.find(app => app.packageName === devDependency)!;
					return new TreeItem({
						projects,
						extensionPath,
						label: appName,
						tooltip: 'dev dependency',
						icon: 'devDependency'
					}, this);
				})
			];
		}
	}
}

export { DependencyTreeDataProvider, TreeItem };
