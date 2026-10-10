import { StatusBarAlignment, window, MarkdownString, StatusBarItem as VSCodeStatusBarItem } from 'vscode';

import { commands } from './commands';
import { getSettings } from './settings';
import { Subscriptions } from './models/subscription';


class StatusBarItem {
	public statusBarItem: VSCodeStatusBarItem;
	public updateTooltip?: () => string | MarkdownString;

	constructor(id: string, text: string, icon: string, tooltip: string, priority: number, command = commands.doNothing, updateTooltip?: () => string | MarkdownString) {
		this.statusBarItem = window.createStatusBarItem(id, StatusBarAlignment.Left, priority * -1);
		this.statusBarItem.text = `${icon ? `$(${icon})` : ''} ${text}`.trim();
		this.statusBarItem.name = `Monorepo Tools - ${id}`;
		this.statusBarItem.tooltip = tooltip;
		this.statusBarItem.command = command;
		this.statusBarItem.show();

		this.updateTooltip = updateTooltip;
	}

	public initialize(subscriptions: Subscriptions) {
		subscriptions.push(this.statusBarItem);
		this.update();
	}

	public update() {
		if (this.updateTooltip)
			this.statusBarItem.tooltip = this.updateTooltip();
	}
}

class StatusBarItems {
	public showTerminal: StatusBarItem;
	public packageManager: StatusBarItem;
	public installPackages: StatusBarItem;

	constructor(subscriptions: Subscriptions) {
		this.showTerminal = new StatusBarItem('Show Terminal', 'Terminal', 'terminal-cmd', 'Show Terminal', 1, commands.showTerminal);
		this.packageManager = new StatusBarItem('Package Manger', 'Switch Package Manger', 'symbol-color', 'Switcher', 2, undefined, updatePackageManagerStatusBarItem);
		this.installPackages = new StatusBarItem('Install Packages', 'Install Packages', 'package', 'Install All Packages', 3, commands.installPackages);

		this.showTerminal.initialize(subscriptions);
		this.packageManager.initialize(subscriptions);
		this.installPackages.initialize(subscriptions);

		function updatePackageManagerStatusBarItem() {

			const { packageManager: currentPackageManager } = getSettings();

			const tooltip = new MarkdownString('', true);
			tooltip.supportHtml = true;
			tooltip.isTrusted = true;
			tooltip.appendMarkdown('<h4 align="center">Change Package Manager</h4>\n');
			tooltip.appendMarkdown('<table width="100%" border="1"><tr>');
			tooltip.appendMarkdown(`<td align="center">${getIcon('npm')}</td>`);
			tooltip.appendMarkdown(`<td align="center">${getIcon('pnpm')}</td>`);
			tooltip.appendMarkdown(`<td align="center">${getIcon('bun')}</td>`);
			tooltip.appendMarkdown('</tr></table>');

			return tooltip;


			function getIcon(packageManager: string) {
				const iconDir = 'https://raw.githubusercontent.com/zeru-t/package-manager-tools/refs/heads/main/icons';
				const image = `<h3><img height="18" border="1" src="${iconDir}/${packageManager}.png" alt="${packageManager}" title="${packageManager}" /></h3>`;
				const isCurrent = currentPackageManager === packageManager;
				const name = isCurrent ? `<mark><b><i>&nbsp;${packageManager}&nbsp;</i></b></mark>` : packageManager;
				const command = `(command:${commands.changePackageManager}?"${packageManager}")`;
				return `\n\n[${image}${name}]${command}\n`;
			}
		}
	}
}

export { StatusBarItem, StatusBarItems };
