import { TreeItemCollapsibleState, TreeDataProvider, TreeItem as VSCodeTreeItem, EventEmitter, Event, ExtensionContext, Uri, TreeView, window } from 'vscode';

import { AppInfo } from '../appInfo';
import { optional, project, treeItemProps } from '../models';


type ChangeTreeData = optional<TreeItem>;


class DependencyTree {

	public Tree: TreeView<TreeItem>;

	constructor(treeDataProvider: DependencyTreeDataProvider) {
		this.Tree = window.createTreeView('monorepo-dependencies', { treeDataProvider, showCollapseAll: true });
	}

	public showItem(treeItem: TreeItem) {
		return this.updateItem(treeItem, true);
	}
	public focusItem(treeItem: TreeItem) {
		return this.updateItem(treeItem, true, true);
	}
	public expandItem(treeItem: TreeItem) {
		return this.updateItem(treeItem, false, false, 1);
	}
	public updateItem(treeItem: TreeItem, select?: boolean, focus?: boolean, expand?: boolean | number) {
		return this.Tree.reveal(treeItem, { expand, select, focus });
	}
}

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

	public async expandAll(dependencyTree: DependencyTree) {
		for (const treeItem of this.TreeItems)
			await expand(dependencyTree, treeItem);
		await dependencyTree.showItem(this.TreeItems[0]);

		async function expand(dependencyTree: DependencyTree, treeItem: TreeItem) {
			if (treeItem.collapsibleState === TreeItemCollapsibleState.None)
				return;
			await dependencyTree.expandItem(treeItem);
		}
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
					const { projectName, path, dependencies, devDependencies } = project;
					const allDependencies = [...dependencies, ...devDependencies];
					const hasDeps = !!allDependencies.length;
					return new TreeItem({
						project,
						projects,
						extensionPath,
						path,
						label: projectName,
						collapsible: hasDeps,
						icon: 'project'
					}, this);
				});
		}

		const treeItemProject = projects.find(({ projectName }) => projectName === label);
		if (treeItemProject) {
			const { dependencies, devDependencies } = treeItemProject;
			this.children = [
				...dependencies.map(dependency => {
					const { projectName } = projects.find(({ packageName }) => packageName === dependency)!;
					return new TreeItem({
						projects,
						extensionPath,
						label: projectName,
						tooltip: 'dependency',
						icon: 'dependency'
					}, this);
				}),
				...devDependencies.map(devDependency => {
					const { projectName } = projects.find(({ packageName }) => packageName === devDependency)!;
					return new TreeItem({
						projects,
						extensionPath,
						label: projectName,
						tooltip: 'dev dependency',
						icon: 'devDependency'
					}, this);
				})
			];
		}
	}
}

export { DependencyTree, DependencyTreeDataProvider, TreeItem };
