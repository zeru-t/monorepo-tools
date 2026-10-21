import { subscriptions } from '../models';

import { commands as VSCodeCommands } from 'vscode';


const commands = {

	/** Show Terminal window (Status Bar Item) */
	showTerminal: 'workbench.action.terminal.focus' as const,

	/** Toggle Bottom Panel (Status Bar Item) */
	togglePanel: 'workbench.action.togglePanel' as const,

	/** Show/Hide Annotations in _package.json_ file */
	toggleHideAnnotations: 'MonorepoTools.toggleHideAnnotations' as const,

	/** Open Package Manager Picker (Status Bar Item) */
	changePackageManager: 'MonorepoTools.changePackageManager' as const,

	/** Open Package Picker: Select a `Project` and find a `Package` to install into it */
	installPackage: 'MonorepoTools.installPackage' as const,

	/** Install all workspace `Packages` */
	installAllPackages: 'MonorepoTools.installAllPackages' as const,

	/** Open Package Picker: Find a `Package` to install into the `Selected Project` */
	installProjectPackage: 'MonorepoTools.installProjectPackage' as const,

	/** Set `Active Project` */
	setProject: 'MonorepoTools.setProject' as const,

	/** Run the `Selected Project` or `Active Project` */
	runProject: 'MonorepoTools.runProject' as const,

	/** Go to the `Selected Project`'s _package.json_ file */
	goToProject: 'MonorepoTools.goToProject' as const,

	/** Build all `Projects` */
	buildProjects: 'MonorepoTools.buildProjects' as const,

	/** Refresh `Dependencies Tree` */
	refreshDependencies: 'MonorepoTools.refreshDependencies' as const,

	/** Collapse `Dependencies Tree` */
	collapseTree: 'MonorepoTools.collapseTree' as const,

	/** Expand `Dependencies Tree` */
	expandTree: 'MonorepoTools.expandTree' as const,

	/** Do nothing */
	doNothing: 'MonorepoTools.clickPackageManager' as const
};

function createCommandFn(subscriptions: subscriptions) {
	return async <T>(commandId: string, command: (args: T) => void) => {
		const allCommands = await VSCodeCommands.getCommands();
		if (!allCommands.includes(commandId))
			subscriptions.push(VSCodeCommands.registerCommand(commandId, command));
	};
}

function setContext<T>(key: string, value: T) {
	return VSCodeCommands.executeCommand('setContext', key, value);
}

export { commands, createCommandFn, setContext };
