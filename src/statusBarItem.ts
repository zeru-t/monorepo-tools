import { StatusBarAlignment, window, MarkdownString, StatusBarItem as VSCodeStatusBarItem, workspace, ExtensionContext } from 'vscode';

import { commands } from './commands';
import { getSettings } from './settings';
import { Subscriptions } from './models/subscription';
import { StatusBarItemProps, StatusBarItemUpdate, UpdateStatusBarItem } from './models/statusBar';


class StatusBarItem {

	public statusBarItem: VSCodeStatusBarItem;
	public updateStatusBarItem?: UpdateStatusBarItem;

	constructor({ priority, text = '', icon, tooltip, command, updateStatusBarItem }: StatusBarItemProps) {
		this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 4000 - priority);

		this.statusBarItem.name = 'Monorepo Tools';
		this.statusBarItem.text = `${icon ? `$(${icon})` : ''}${text ? ` ${text}` : ''}`;
		this.statusBarItem.tooltip = tooltip;

		if (command)
			this.statusBarItem.command = command;

		if (priority < 4) {
			this.statusBarItem.color = '#d2b5dd';
		}

		this.updateStatusBarItem = updateStatusBarItem;

		this.statusBarItem.show();
	}

	public initialize(subscriptions: Subscriptions) {
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
	constructor(subscriptions: Subscriptions, priority: number, numSpaces = 1) {
		for (let i = 0; i < numSpaces; i++) {
			const spacer = new StatusBarItem({ text: ' ', priority });
			spacer.initialize(subscriptions);
		}
	}
}

class StatusBar {

	public showTerminal: StatusBarItem;
	public packageManager: StatusBarItem;
	public installPackages: StatusBarItem;
	public apps: StatusBarItem;
	public runApp: StatusBarItem;
	public buildApp: StatusBarItem;

	constructor({ subscriptions, workspaceState }: ExtensionContext) {

		const currentApp = () => workspaceState.get<string>('app') ?? 'Select Current App';

		this.apps = new StatusBarItem({ text: currentApp(), icon: 'project', tooltip: 'Apps', updateStatusBarItem: updateAppsStatusBarItem, priority: 1 });
		this.runApp = new StatusBarItem({ icon: 'run', tooltip: `Run ${currentApp()}`, updateStatusBarItem: updateRunAppStatusBarItem, priority: 2 });
		this.buildApp = new StatusBarItem({ icon: 'tools', tooltip: `Build ${currentApp()}`, updateStatusBarItem: updateBuildAppStatusBarItem, priority: 3 });

		new StatusBarSpacer(subscriptions, 4, 2);

		this.showTerminal = new StatusBarItem({ text: 'Terminal', icon: 'terminal-cmd', tooltip: 'Show Terminal', command: commands.showTerminal, priority: 5 });
		this.packageManager = new StatusBarItem({ text: 'Switch Package Manger', icon: 'symbol-color', updateStatusBarItem: updatePackageManagerStatusBarItem, priority: 6 });
		this.installPackages = new StatusBarItem({ text: 'Install Packages', icon: 'package', tooltip: 'Install All Packages', command: commands.installPackages, priority: 7 });

		new StatusBarSpacer(subscriptions, 10, 4);

		this.apps.initialize(subscriptions);
		this.runApp.initialize(subscriptions);
		this.buildApp.initialize(subscriptions);
		this.showTerminal.initialize(subscriptions);
		this.packageManager.initialize(subscriptions);
		this.installPackages.initialize(subscriptions);


		function updatePackageManagerStatusBarItem() {

			const { packageManager: currentPackageManager } = getSettings();

			const tooltip = new MarkdownString('', true);
			tooltip.supportHtml = true;
			tooltip.isTrusted = true;
			tooltip.appendMarkdown('<h2 align="center">Change Package Manager</h2>\n');
			tooltip.appendMarkdown('<table width="100%" border="1"><tr>');
			tooltip.appendMarkdown(`<td align="center">${getIcon('npm')}</td>`);
			tooltip.appendMarkdown(`<td align="center">${getIcon('pnpm')}</td>`);
			tooltip.appendMarkdown(`<td align="center">${getIcon('bun')}</td>`);
			tooltip.appendMarkdown('</tr></table>');

			return { tooltip } as StatusBarItemUpdate;


			function getIcon(packageManager: string) {
				const toolTip = `Switch to '${packageManager}'`;
				const iconDir = 'https://raw.githubusercontent.com/zeru-t/package-manager-tools/refs/heads/main/icons';
				const image = `<h1><img height="27" border="1" src="${iconDir}/${packageManager}.png" alt="${toolTip}" title="${toolTip}" /></h1>`;
				const isCurrent = currentPackageManager === packageManager;
				const name = isCurrent ? `<mark><b><i>&nbsp;${packageManager}&nbsp;</i></b></mark>` : packageManager;
				const command = `(command:${commands.changePackageManager}?"${packageManager}" "${toolTip}")`;
				return `\n\n### [${image}${name}]${command}\n`;
			}
		}
		async function updateAppsStatusBarItem() {

			const root = workspace.workspaceFolders?.[0]?.uri.path;
			if (!root)
				return;

			const packageFiles = await workspace.findFiles('**/package.json', '**/node_modules/**');
			const apps = packageFiles
				.map(file => file.path.replace(`${root}/`, '').replace(new RegExp('(/)?package.json', 'g'), ''))
				.sort()
				.reduce(reduceApps, {});

			const tooltip = new MarkdownString('', true);
			tooltip.supportHtml = true;
			tooltip.isTrusted = true;
			tooltip.appendMarkdown('<h1>Change Current App</h1>\n');
			tooltip.appendMarkdown(`<h2><div>${workspace.name}/</div>`);
			Object.entries(apps).forEach(updateTooltip);
			tooltip.appendMarkdown('</h2>');

			return { tooltip, text: currentApp() } as StatusBarItemUpdate;


			function reduceApps(allApps: Record<string, string[]>, app: string) {
				const [folder, appName] = app.split('/');
				if (allApps[folder])
					allApps[folder] = [...allApps[folder], appName].sort();
				else if (folder && appName)
					allApps[folder] = [appName];
				return allApps;
			}

			function updateTooltip([folder, apps]: [string, string[]]) {
				tooltip.appendMarkdown(`&nbsp;&nbsp;- ${folder}/<br/>`);
				apps.forEach((app, index) => {
					const isLast = index === apps.length - 1;
					const icon = isLast ? '└' : '├';
					const appName = currentApp() == app ? `<b><i style="color:red">${app}/</i></b>` : `<a href='command:${commands.setApp}?"${app}"'>${app}/</a>`;
					tooltip.appendMarkdown(`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${icon}─ ${appName}</br>`);
				});
			}

		}
		function updateRunAppStatusBarItem() {
			return { tooltip: `Run ${currentApp()}` } as StatusBarItemUpdate;
		}
		function updateBuildAppStatusBarItem() {
			return { tooltip: `Build ${currentApp()}` } as StatusBarItemUpdate;
		}
	}

	public updateAppStatusBarItems() {
		this.apps.update();
		this.runApp.update();
		this.buildApp.update();
	}
}

export { StatusBar, StatusBarItem };
