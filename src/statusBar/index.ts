import { ExtensionContext, MarkdownString, StatusBarAlignment, StatusBarItem as VSCodeStatusBarItem, window, workspace } from 'vscode';

import { AppInfo } from '../appInfo';
import { commands } from '../commands';
import { appInfo, statusBarItemUpdate, subscriptions, statusBarItemProps, updateStatusBarItem } from '../models';
import { getSettings } from '../settings';


class StatusBar {

	private showTerminal: StatusBarItem;
	private packageManager: StatusBarItem;
	private installPackages: StatusBarItem;
	private apps: StatusBarItem;
	private runApp: StatusBarItem;
	private buildApp: StatusBarItem;

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

	public async updateAppStatusBarItems() {
		await this.updateStatusBarItems('apps');
		await this.updateStatusBarItems('runApp');
		await this.updateStatusBarItems('buildApp');
	}
	public updateStatusBarItems(item: 'showTerminal' | 'packageManager' | 'installPackages' | 'apps' | 'runApp' | 'buildApp') {
		return this[item].update();
	}
}

class StatusBarItem {

	public statusBarItem: VSCodeStatusBarItem;
	public updateStatusBarItem?: updateStatusBarItem;

	constructor({ priority, text = '', icon, tooltip, command, updateStatusBarItem }: statusBarItemProps) {
		this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 4000 - priority);

		this.statusBarItem.name = 'Monorepo Tools';
		this.statusBarItem.text = `${icon ? `$(${icon})` : ''}${text ? ` ${text}` : ''}`;
		this.statusBarItem.tooltip = tooltip;

		if (command)
			this.statusBarItem.command = command;

		if (priority < 4)
			this.statusBarItem.color = '#d2b5dd';

		this.updateStatusBarItem = updateStatusBarItem;

		this.statusBarItem.show();
	}

	public initialize(subscriptions: subscriptions) {
		subscriptions.push(this.statusBarItem);
		this.update();
	}

	public async update() {
		if (!this.updateStatusBarItem)
			return;
		const updateResponse = await this.updateStatusBarItem();
		if (!updateResponse)
			return;
		const { text, icon, tooltip } = updateResponse;
		if (text || icon) {
			const regex = new RegExp(/^(\$\((.*)\)) (.*)$/);
			const [currentIcon, currentText] = regex.exec(this.statusBarItem.text)!.slice(-2);
			const newIcon = icon || currentIcon;
			const newText = text || currentText;
			this.statusBarItem.text = `${newIcon ? `$(${newIcon})` : ''} ${newText ? ` ${newText}` : ''}`;
		}
		if (tooltip)
			this.statusBarItem.tooltip = tooltip;
	}

}

class StatusBarSpacer {
	constructor(subscriptions: subscriptions, priority: number, numSpaces = 1) {
		for (let i = 0; i < numSpaces; i++) {
			const spacer = new StatusBarItem({ text: ' ', priority });
			spacer.initialize(subscriptions);
		}
	}
}


export { StatusBar };
