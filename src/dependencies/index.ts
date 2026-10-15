import { TreeItemCollapsibleState, TreeDataProvider, TreeItem as VSCodeTreeItem, ThemeIcon, TreeItemLabel } from 'vscode';

import { AppInfo } from '../appInfo';


class DependencyTreeDataProvider implements TreeDataProvider<TreeItem> {

	private _appInfo: AppInfo;

	constructor(appInfo: AppInfo) {
		this._appInfo = appInfo;
	}

	getTreeItem(element: TreeItem): TreeItem {
		return element;
	}

	getChildren(element?: TreeItem): TreeItem[] {
		const { appInfo } = this._appInfo;

		if (!element) {
			return appInfo
				.map(({ folder }) => folder)
				.unique()
				.map((folder) => new TreeItem({ label: folder, collapsible: true }));
		}

		const app = appInfo.find(app => app.appName === element.label);
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

		return appInfo
			.filter(({ folder }) => folder === element.label)
			.map(({ appName, dependencies, devDependencies }) => {
				const allDependencies = [...dependencies, ...devDependencies];
				const hasDeps = !!allDependencies.length;
				return new TreeItem({
					label: appName,
					collapsible: hasDeps,
					description: hasDeps ? undefined : '(no monorepo dependencies)'
				});
			});
	}

}

interface TreeItemProps {
	label: string | TreeItemLabel;
	collapsible?: boolean;
	tooltip?: string;
	icon?: string;
	description?: string;
}
class TreeItem extends VSCodeTreeItem {
	constructor({ label, collapsible, tooltip, icon, description }: TreeItemProps) {
		super(label, collapsible ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None);
		this.tooltip = tooltip;
		this.description = description;
		if (icon)
			this.iconPath = new ThemeIcon(icon);
	}
}

export { DependencyTreeDataProvider };
