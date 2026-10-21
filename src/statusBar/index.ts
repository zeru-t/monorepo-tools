import { ExtensionContext, MarkdownString, StatusBarAlignment, StatusBarItem as VSCodeStatusBarItem, window, workspace } from 'vscode';

import { commands } from '../commands';
import { project, statusBarItemUpdate, subscriptions, statusBarItemProps, updateStatusBarItem } from '../models';
import { getSettings } from '../settings';


class StatusBar {

	private projects: StatusBarItem;
	private runProject: StatusBarItem;
	private buildProjects: StatusBarItem;

	private packageManager: StatusBarItem;
	private installPackage: StatusBarItem;

	private showTerminal: StatusBarItem;
	private togglePanel: StatusBarItem;

	constructor({ subscriptions, workspaceState }: ExtensionContext, projects: project[]) {

		const currentProject = () => workspaceState.get<string>('project');

		this.projects = new StatusBarItem({ text: currentProject() ?? 'Select Current Project', icon: 'project', command: commands.setProject, updateStatusBarItem: updateProjectsStatusBarItem, priority: 1 });
		this.runProject = new StatusBarItem({ icon: 'run', tooltip: currentProject() ? `Run ${currentProject()}` : '', command: commands.runProject, updateStatusBarItem: updateRunProjectStatusBarItem, priority: 2 });
		this.buildProjects = new StatusBarItem({ icon: 'tools', tooltip: 'Build All Projects', command: commands.buildProjects, priority: 3 });

		new StatusBarSpacer(subscriptions, 4, 2);

		this.packageManager = new StatusBarItem({ text: 'Switch Package Manger', icon: 'symbol-color', tooltip: 'Select a Package Manager', command: commands.changePackageManager, updateStatusBarItem: updatePackageManagerStatusBarItem, priority: 5 });
		this.installPackage = new StatusBarItem({ text: 'Install Package', icon: 'package', tooltip: 'Install Packages', command: commands.installPackage, priority: 6 });

		new StatusBarSpacer(subscriptions, 7, 2);

		this.showTerminal = new StatusBarItem({ text: 'Terminal', icon: 'terminal-cmd', tooltip: 'Show Terminal', command: commands.showTerminal, priority: 8 });
		this.togglePanel = new StatusBarItem({ icon: 'layout-panel', tooltip: 'Toggle Bottom Panel', command: commands.togglePanel, priority: 9 });

		new StatusBarSpacer(subscriptions, 10, 4);

		this.projects.initialize(subscriptions);
		this.runProject.initialize(subscriptions);
		this.buildProjects.initialize(subscriptions);
		this.showTerminal.initialize(subscriptions);
		this.togglePanel.initialize(subscriptions);
		this.packageManager.initialize(subscriptions);
		this.installPackage.initialize(subscriptions);


		function updatePackageManagerStatusBarItem() {
			const { packageManager } = getSettings();
			return { text: packageManager ?? 'Select a Package Manager' } as statusBarItemUpdate;
		}
		function updateProjectsStatusBarItem() {
			const groupedProjects = Object.entries(Object.groupBy(projects, ({ folder }) => folder) as Record<string, project[]>);
			return { text: groupedProjects.length ? currentProject() ?? 'Select a Project' : workspace.name } as statusBarItemUpdate;
		}
		function updateRunProjectStatusBarItem() {
			if (!currentProject())
				return { hide: true } as statusBarItemUpdate;
			const tooltip = new MarkdownString(`Run <b><i>${currentProject()}</i></b>`, true);
			tooltip.supportHtml = true;
			tooltip.isTrusted = true;
			return { tooltip, show: true } as statusBarItemUpdate;
		}
	}

	public updateProjectStatusBarItems() {
		this.updateStatusBarItems('projects');
		this.updateStatusBarItems('runProject');
	}
	public updateStatusBarItems(item: 'showTerminal' | 'packageManager' | 'installPackage' | 'projects' | 'runProject' | 'buildProjects') {
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

	public update() {
		if (!this.updateStatusBarItem)
			return;
		const updateResponse = this.updateStatusBarItem();
		if (!updateResponse)
			return;
		const { text, icon, tooltip, hide, show } = updateResponse;
		if (hide)
			this.statusBarItem.hide();
		if (show)
			this.statusBarItem.show();
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
