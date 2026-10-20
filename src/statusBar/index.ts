import { ExtensionContext, MarkdownString, StatusBarAlignment, StatusBarItem as VSCodeStatusBarItem, window, workspace } from 'vscode';

import { commands } from '../commands';
import { project, statusBarItemUpdate, subscriptions, statusBarItemProps, updateStatusBarItem } from '../models';
import { getSettings } from '../settings';


class StatusBar {

	private showTerminal: StatusBarItem;
	private packageManager: StatusBarItem;
	private installPackage: StatusBarItem;
	private projects: StatusBarItem;
	private runProject: StatusBarItem;
	private buildProjects: StatusBarItem;

	constructor({ subscriptions, workspaceState }: ExtensionContext, projects: project[]) {

		const currentProject = () => workspaceState.get<string>('project');

		this.projects = new StatusBarItem({ text: currentProject() ?? 'Select Current Project', icon: 'project', tooltip: 'Projects', updateStatusBarItem: updateProjectsStatusBarItem, priority: 1 });
		this.runProject = new StatusBarItem({ icon: 'run', tooltip: currentProject() ? `Run ${currentProject()}` : '', command: commands.runProject, updateStatusBarItem: updateRunProjectStatusBarItem, priority: 2 });
		this.buildProjects = new StatusBarItem({ icon: 'tools', tooltip: 'Build All Projects', command: commands.buildProjects, priority: 3 });

		new StatusBarSpacer(subscriptions, 4, 2);

		this.packageManager = new StatusBarItem({ text: 'Switch Package Manger', icon: 'symbol-color', tooltip: 'Select a Package Manager', command: commands.changePackageManager, updateStatusBarItem: updatePackageManagerStatusBarItem, priority: 5 });
		this.installPackage = new StatusBarItem({ text: 'Install Package', icon: 'package', tooltip: 'Install All Packages', command: commands.installPackage, priority: 6 });

		new StatusBarSpacer(subscriptions, 7, 2);

		this.showTerminal = new StatusBarItem({ text: 'Terminal', icon: 'terminal-cmd', tooltip: 'Show Terminal', command: commands.showTerminal, priority: 8 });

		new StatusBarSpacer(subscriptions, 9, 4);

		this.projects.initialize(subscriptions);
		this.runProject.initialize(subscriptions);
		this.buildProjects.initialize(subscriptions);
		this.showTerminal.initialize(subscriptions);
		this.packageManager.initialize(subscriptions);
		this.installPackage.initialize(subscriptions);


		function updatePackageManagerStatusBarItem() {
			const { packageManager } = getSettings();
			return { text: packageManager ?? 'Select a Package Manager' } as statusBarItemUpdate;
		}
		async function updateProjectsStatusBarItem() {

			const groupedProjects = Object.entries(Object.groupBy(projects, ({ folder }) => folder) as Record<string, project[]>);

			const tooltip = new MarkdownString('', true);
			tooltip.supportHtml = true;
			tooltip.isTrusted = true;

			if (!groupedProjects.length) {
				return { tooltip, text: workspace.name } as statusBarItemUpdate;
			}
			else {
				tooltip.appendMarkdown(`<h1>${currentProject() ? 'Change Current Project' : 'Projects'}</h1>\n`);
				tooltip.appendMarkdown(`<h2><div>${workspace.name}/</div>`);
				groupedProjects.forEach(updateTooltip);
				tooltip.appendMarkdown('</h2>');

				return { tooltip, text: currentProject() ?? 'Select a Project' } as statusBarItemUpdate;
			}


			function updateTooltip([folder, projects]: [string, project[]]) {
				tooltip.appendMarkdown(`&nbsp;&nbsp;- ${folder}/<br/>`);
				projects.forEach(({ projectName }, index) => {
					const isLast = index === projects.length - 1;
					const icon = isLast ? '└' : '├';
					const project = currentProject() == projectName ? `<b><i style="color:red">${projectName}/</i></b>` : `<a href='command:${commands.setProject}?"${projectName}"'>${projectName}/</a>`;
					tooltip.appendMarkdown(`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${icon}─ ${project}</br>`);
				});
			}

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

	public async updateProjectStatusBarItems() {
		await this.updateStatusBarItems('projects');
		await this.updateStatusBarItems('runProject');
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

	public async update() {
		if (!this.updateStatusBarItem)
			return;
		const updateResponse = await this.updateStatusBarItem();
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
