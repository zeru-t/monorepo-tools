import { MarkdownString, workspace, ExtensionContext } from 'vscode';

import { AppInfo } from '../appInfo';
import { commands } from '../commands';
import { appInfo, statusBarItemUpdate } from '../models';
import { getSettings } from '../settings';

import { StatusBarItem } from './item';
import { StatusBarSpacer } from './spacer';


class StatusBar {

	public showTerminal: StatusBarItem;
	public packageManager: StatusBarItem;
	public installPackages: StatusBarItem;
	public apps: StatusBarItem;
	public runApp: StatusBarItem;
	public buildApp: StatusBarItem;

	constructor({ subscriptions, workspaceState }: ExtensionContext, { appInfo }: AppInfo) {

		const currentApp = () => workspaceState.get<string>('app');

		this.apps = new StatusBarItem({ text: currentApp() ?? 'Select Current App', icon: 'project', tooltip: 'Apps', updateStatusBarItem: updateAppsStatusBarItem, priority: 1 });
		this.runApp = new StatusBarItem({ icon: 'run', tooltip: `Run ${currentApp() || workspace.name}`, command: commands.runApp, updateStatusBarItem: updateRunAppStatusBarItem, priority: 2 });
		this.buildApp = new StatusBarItem({ icon: 'tools', tooltip: `Build ${currentApp() || workspace.name}`, command: commands.buildApp, updateStatusBarItem: updateBuildAppStatusBarItem, priority: 3 });

		new StatusBarSpacer(subscriptions, 4, 2);

		this.packageManager = new StatusBarItem({ text: 'Switch Package Manger', icon: 'symbol-color', tooltip: 'Select a Package Manager', command: commands.changePackageManager, updateStatusBarItem: updatePackageManagerStatusBarItem, priority: 5 });
		this.installPackages = new StatusBarItem({ text: 'Install Packages', icon: 'package', tooltip: 'Install All Packages', command: commands.installPackages, priority: 6 });

		new StatusBarSpacer(subscriptions, 7, 2);

		this.showTerminal = new StatusBarItem({ text: 'Terminal', icon: 'terminal-cmd', tooltip: 'Show Terminal', command: commands.showTerminal, priority: 8 });

		new StatusBarSpacer(subscriptions, 9, 4);

		this.apps.initialize(subscriptions);
		this.runApp.initialize(subscriptions);
		this.buildApp.initialize(subscriptions);
		this.showTerminal.initialize(subscriptions);
		this.packageManager.initialize(subscriptions);
		this.installPackages.initialize(subscriptions);


		function updatePackageManagerStatusBarItem() {
			const { packageManager } = getSettings();
			return { text: packageManager ?? 'Select a Package Manager' } as statusBarItemUpdate;
		}
		async function updateAppsStatusBarItem() {

			const groupedAppInfo = Object.entries(Object.groupBy(appInfo, ({ folder }) => folder) as Record<string, appInfo[]>);

			const tooltip = new MarkdownString('', true);
			tooltip.supportHtml = true;
			tooltip.isTrusted = true;

			if (!groupedAppInfo.length) {
				return { tooltip, text: workspace.name } as statusBarItemUpdate;
			}
			else {
				tooltip.appendMarkdown('<h1>Change Current App</h1>\n');
				tooltip.appendMarkdown(`<h2><div>${workspace.name}/</div>`);
				groupedAppInfo.forEach(updateTooltip);
				tooltip.appendMarkdown('</h2>');

				return { tooltip, text: currentApp() ?? 'Select Current App' } as statusBarItemUpdate;
			}


			function updateTooltip([folder, apps]: [string, appInfo[]]) {
				tooltip.appendMarkdown(`&nbsp;&nbsp;- ${folder}/<br/>`);
				apps.forEach(({ appName: app }, index) => {
					const isLast = index === apps.length - 1;
					const icon = isLast ? '└' : '├';
					const appName = currentApp() == app ? `<b><i style="color:red">${app}/</i></b>` : `<a href='command:${commands.setApp}?"${app}"'>${app}/</a>`;
					tooltip.appendMarkdown(`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${icon}─ ${appName}</br>`);
				});
			}

		}
		function updateRunAppStatusBarItem() {
			const tooltip = new MarkdownString(`Run <b><i>${currentApp() || workspace.name}</i></b>`, true);
			tooltip.supportHtml = true;
			tooltip.isTrusted = true;
			return { tooltip } as statusBarItemUpdate;
		}
		function updateBuildAppStatusBarItem() {
			const tooltip = new MarkdownString(`Build <b><i>${currentApp() || workspace.name}</i></b>`, true);
			tooltip.supportHtml = true;
			tooltip.isTrusted = true;
			return { tooltip } as statusBarItemUpdate;
		}
	}

	public updateAppStatusBarItems() {
		this.apps.update();
		this.runApp.update();
		this.buildApp.update();
	}
}

export { StatusBar };
