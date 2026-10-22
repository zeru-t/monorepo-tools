import { TreeItemCollapsibleState, TreeDataProvider, TreeItem as VSCodeTreeItem, EventEmitter, Event, ExtensionContext, Uri, TreeView, window } from 'vscode';

import { AppInfo } from '../appInfo';
import { optional, project, treeItemProps, undefinable } from '../models';


type ChangeTreeData = optional<TreeItem>;

class DependencyTree {

	public Tree: TreeView<TreeItem>;

	constructor(treeDataProvider: DependencyTreeDataProvider) {
		this.Tree = window.createTreeView('monorepo-dependencies', { treeDataProvider });
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

	constructor({ extensionPath }: ExtensionContext, currentProject: undefinable<string>, appInfo: AppInfo) {
		this._extensionPath = extensionPath;
		this._appInfo = appInfo;

		this.TreeItems = this.getTreeItems(currentProject);

		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
	}

	public getTreeItems(currentProject: undefinable<string>) {
		return this._appInfo.projects
			.map(({ folder }) => folder)
			.unique()
			.map(folder => new TreeItem(currentProject, { projects: this._appInfo.projects, extensionPath: this._extensionPath, name: folder, context: 'folder', collapsible: true }));
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

	public async refresh(currentProject: undefinable<string>) {
		await this._appInfo.refresh();
		this.TreeItems = this.getTreeItems(currentProject);
		this._onDidChangeTreeData.fire();
	}
	public update(currentProject: undefinable<string>) {

		this.TreeItems.forEach(item => {
			if (item.contextValue == 'folder' && item.children?.some(child => child.name === currentProject)) {
				item.children.forEach(child => {
					if (child.contextValue !== 'project' || child.name !== currentProject) {
						child.label = child.name;
						return;
					}
					child.label = { label: child.name, highlights: [[0, child.name.length]] };
					this.updateItem(TreeItemCollapsibleState.Expanded)(child.parent!);
				});
				this.updateItem(TreeItemCollapsibleState.Expanded)(item);
			}
			else {
				item.children?.forEach(child => {
					child.label = child.name;
				});
			}
		});
		this._onDidChangeTreeData.fire();
	}

	public expandAll() {
		return () => {
			this.TreeItems.forEach(this.updateItem(TreeItemCollapsibleState.Expanded));
			this._onDidChangeTreeData.fire();
		};
	}
	public collapseAll(currentProject: undefinable<string>) {
		this.TreeItems
			.filter(treeItem => !treeItem.children?.some(c => c.name === currentProject))
			.forEach(this.updateItem(TreeItemCollapsibleState.Collapsed));
		this._onDidChangeTreeData.fire();
	}
	private updateItem(state: TreeItemCollapsibleState) {
		return (treeItem: TreeItem) => {
			treeItem.collapsibleState = state;
			treeItem.id = `${treeItem.name}-${new Date().getTime()}`;
		};
	}
}

class TreeItem extends VSCodeTreeItem {
	public id: string;
	public path = '';
	public children?: TreeItem[];
	public parent?: TreeItem;

	public name: string;
	public project?: project;

	constructor(currentProject: undefinable<string>, { projects, extensionPath, name, path, collapsible, tooltip, icon, description, project, context }: treeItemProps, parent?: TreeItem) {
		super(name, collapsible ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);

		this.id = `${name}-${new Date().getTime()}`;
		this.name = name;

		this.tooltip = tooltip;
		this.description = description;

		this.project = project;

		this.iconPath = Uri.file(`${extensionPath}/icons/${icon ?? 'folder'}.svg`);

		this.children = [];
		this.parent = parent;

		if (context)
			this.contextValue = context;

		if (path)
			this.path = path;

		const folderProjects = projects.filter(({ folder }) => folder === name);
		if (folderProjects.length) {
			this.children = folderProjects
				.map((project) => {
					const { projectName, path, dependencies, devDependencies } = project;
					const allDependencies = [...dependencies, ...devDependencies];
					const hasDeps = !!allDependencies.length;
					return new TreeItem(currentProject, {
						project,
						projects,
						extensionPath,
						path,
						context: 'project',
						name: projectName,
						collapsible: hasDeps,
						icon: 'project'
					}, this);
				});
		}

		const treeItemProject = projects.find(({ projectName }) => projectName === name);
		if (treeItemProject) {
			const { dependencies, devDependencies } = treeItemProject;
			this.children = [
				...dependencies.map(dependency => {
					const { projectName } = projects.find(({ packageName }) => packageName === dependency)!;
					return new TreeItem(currentProject, {
						projects,
						extensionPath,
						name: projectName,
						tooltip: 'dependency',
						icon: 'dependency'
					}, this);
				}),
				...devDependencies.map(devDependency => {
					const { projectName } = projects.find(({ packageName }) => packageName === devDependency)!;
					return new TreeItem(currentProject, {
						projects,
						extensionPath,
						name: projectName,
						tooltip: 'dev dependency',
						icon: 'devDependency'
					}, this);
				})
			];
		}

		if (context == 'project' && this.name == currentProject)
			this.label = { label: name, highlights: [[0, name.length]] };

		if (context == 'folder' && this.children?.some(child => child.name === currentProject))
			this.collapsibleState = TreeItemCollapsibleState.Expanded;
	}
}

export { DependencyTree, DependencyTreeDataProvider, TreeItem };
