import { TreeItemCollapsibleState, TreeDataProvider, TreeItem as VSCodeTreeItem, ThemeIcon, EventEmitter, Event, ExtensionContext, Memento } from 'vscode';

import { AppInfo } from '../appInfo';


class DependencyTreeDataProvider implements TreeDataProvider<TreeItem> {

	private _workspaceState: Memento;
	private _appInfo: AppInfo;
	private _onDidChangeTreeData = new EventEmitter<ChangeTreeData>();

	readonly onDidChangeTreeData: Event<ChangeTreeData>;

	constructor({ workspaceState }: ExtensionContext, appInfo: AppInfo) {
		this._workspaceState = workspaceState;
		this._appInfo = appInfo;
		this.onDidChangeTreeData = this._onDidChangeTreeData.event;
	}

	getTreeItem(element: TreeItem) {
		return element;
	}

	getChildren(element?: TreeItem) {
		const { appInfo } = this._appInfo;

		if (!element) {
			return appInfo
				.map(({ folder }) => folder)
				.unique()
				.map((folder) => new TreeItem({ label: folder, collapsible: true }));
		}

		const app = appInfo.find(app => app.appName === element.id);
		if (app) {
			const { dependencies, devDependencies } = app;
			return [
				...dependencies.map(dependency => {
					const { appName } = appInfo.find(app => app.packageName === dependency)!;
					return new TreeItem({
						label: appName,
						tooltip: `${dependency} is a dependency of ${appName}`,
						icon: 'package'
					});
				}),
				...devDependencies.map(devDependency => {
					const { appName } = appInfo.find(app => app.packageName === devDependency)!;
					return new TreeItem({
						label: appName,
						tooltip: `${devDependency} is a devDependency of ${appName}`,
						icon: 'archive'
					});
				})
			];
		}

		const currentApp = this._workspaceState.get<string>('app');
		return appInfo
			.filter(({ folder }) => folder === element.id)
			.map(({ appName, dependencies, devDependencies }) => {
				const allDependencies = [...dependencies, ...devDependencies];
				const hasDeps = !!allDependencies.length;
				return new TreeItem({
					label: appName,
					highlight: appName === currentApp,
					collapsible: hasDeps,
					description: hasDeps ? undefined : '(no monorepo dependencies)'
				});
			});
	}

	refresh() {
		return async () => {
			await this._appInfo.refresh();
			this._onDidChangeTreeData.fire();
		};
	}
}

type ChangeTreeData = TreeItem | undefined | null | void;
interface TreeItemProps {
	label: string;
	highlight?: boolean;
	collapsible?: boolean;
	tooltip?: string;
	icon?: string;
	description?: string;
}
class TreeItem extends VSCodeTreeItem {
	public id: string;

	constructor({ label, collapsible, tooltip, icon, description, highlight }: TreeItemProps) {
		super(label, collapsible ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);
		this.id = label;
		if (highlight)
			this.label = { label, highlights: [[0, label.length]] };
		this.tooltip = tooltip;
		this.description = description;
		if (icon)
			this.iconPath = new ThemeIcon(icon);
	}
}

export { DependencyTreeDataProvider };
