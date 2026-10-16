import { TreeItemCollapsibleState, TreeDataProvider, TreeItem as VSCodeTreeItem, EventEmitter, Event, ExtensionContext, Uri } from 'vscode';

import { AppInfo } from '../appInfo';
import { TreeItemProps } from '../models';


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

	getTreeItems() {
		return this._appInfo.appInfo
			.map(({ folder }) => folder)
			.unique()
			.map(folder => new TreeItem({ appInfo: this._appInfo.appInfo, extensionPath: this._extensionPath, label: folder, collapsible: true }));
	}

	getTreeItem(element: TreeItem) {
		return element;
	}

	getChildren(element?: TreeItem) {
		return element ? element.children : this.TreeItems;
	}

	getParent(element: TreeItem) {
		return element?.parent;
	}

	refresh() {
		return async () => {
			await this._appInfo.refresh();
			this.TreeItems = this.getTreeItems();
			this._onDidChangeTreeData.fire();
		};
	}
}

type ChangeTreeData = TreeItem | undefined | null | void;
class TreeItem extends VSCodeTreeItem {
	public id: string;
	public path = '';
	public children?: TreeItem[];
	public parent?: TreeItem;

	constructor({ appInfo, extensionPath, label, path, collapsible, tooltip, icon, description }: TreeItemProps, parent?: TreeItem) {
		super(label, collapsible ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);

		this.id = label;

		this.tooltip = tooltip;
		this.description = description;

		this.iconPath = Uri.file(`${extensionPath}/icons/${icon ?? 'folder'}.svg`);


		if (path) {
			this.path = path;
			this.contextValue = 'project';
		}

		this.children = [];
		this.parent = parent;

		const folderApps = appInfo.filter(({ folder }) => folder === label);
		if (folderApps.length) {
			this.children = folderApps
				.map(({ appName, path, dependencies, devDependencies }) => {
					const allDependencies = [...dependencies, ...devDependencies];
					const hasDeps = !!allDependencies.length;
					return new TreeItem({
						appInfo,
						extensionPath,
						path,
						label: appName,
						collapsible: hasDeps,
						description: hasDeps ? undefined : 'n/a',
						icon: 'project'
					}, this);
				});
		}

		const app = appInfo.find(app => app.appName === label);
		if (app) {
			const { dependencies, devDependencies } = app;
			this.children = [
				...dependencies.map(dependency => {
					const { appName } = appInfo.find(app => app.packageName === dependency)!;
					return new TreeItem({
						appInfo,
						extensionPath,
						label: appName,
						tooltip: 'dependency',
						icon: 'dependency'
					}, this);
				}),
				...devDependencies.map(devDependency => {
					const { appName } = appInfo.find(app => app.packageName === devDependency)!;
					return new TreeItem({
						appInfo,
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
