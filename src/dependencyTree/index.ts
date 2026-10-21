import { TreeItemCollapsibleState, TreeDataProvider, TreeItem as VSCodeTreeItem, EventEmitter, Event, ExtensionContext, Uri, TreeView, window, Memento } from 'vscode';

import { AppInfo } from '../appInfo';
import { optional, project, treeItemProps } from '../models';


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

	constructor({ extensionPath, workspaceState }: ExtensionContext, appInfo: AppInfo) {
		this._extensionPath = extensionPath;
		this._appInfo = appInfo;

		this.TreeItems = this.getTreeItems(workspaceState);

		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
	}

	public getTreeItems(workspaceState: Memento) {
		return this._appInfo.projects
			.map(({ folder }) => folder)
			.unique()
			.map(folder => new TreeItem(workspaceState, { projects: this._appInfo.projects, extensionPath: this._extensionPath, name: folder, context: 'folder', collapsible: true }));
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

	public refresh(workspaceState: Memento) {
		return async () => {
			await this._appInfo.refresh();
			this.TreeItems = this.getTreeItems(workspaceState);
			this._onDidChangeTreeData.fire();
		};
	}

	public expandAll() {
		return () => {
			this.TreeItems.forEach(this.update(TreeItemCollapsibleState.Expanded));
			this._onDidChangeTreeData.fire();
		};
	}
	public collapseAll(workspaceState: Memento) {
		return () => {
			const project = workspaceState.get<string>('project');
			this.TreeItems
				.filter(treeItem => !treeItem.children?.some(c => c.name === project))
				.forEach(this.update(TreeItemCollapsibleState.Collapsed));
			this._onDidChangeTreeData.fire();
		};
	}
	private update(state: TreeItemCollapsibleState) {
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

	constructor(workspaceState: Memento, { projects, extensionPath, name, path, collapsible, tooltip, icon, description, project, context }: treeItemProps, parent?: TreeItem) {
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
					return new TreeItem(workspaceState, {
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
					return new TreeItem(workspaceState, {
						projects,
						extensionPath,
						name: projectName,
						tooltip: 'dependency',
						icon: 'dependency'
					}, this);
				}),
				...devDependencies.map(devDependency => {
					const { projectName } = projects.find(({ packageName }) => packageName === devDependency)!;
					return new TreeItem(workspaceState, {
						projects,
						extensionPath,
						name: projectName,
						tooltip: 'dev dependency',
						icon: 'devDependency'
					}, this);
				})
			];
		}

		const currentProject = workspaceState.get<string>('project');
		if (context == 'project' && this.name == currentProject)
			this.label = { label: name, highlights: [[0, name.length]] };

		if (context == 'folder' && this.children?.some(child => child.name === currentProject))
			this.collapsibleState = TreeItemCollapsibleState.Expanded;
	}
}

export { DependencyTree, DependencyTreeDataProvider, TreeItem };
