import { subscriptions } from '../models';

import { commands as VSCodeCommands } from 'vscode';


const commands = {

	/** Show Terminal window (Status Bar Item) */
	showTerminal: 'workbench.action.terminal.focus',

	/** Show/Hide Annotations in _package.json_ file */
	toggleHideAnnotations: 'MonorepoTools.toggleHideAnnotations',

	/** Open Package Manager Picker (Status Bar Item) */
	changePackageManager: 'MonorepoTools.changePackageManager',

	/** Open Package Picker: Select a `Project` and find a `Package` to install into it */
	installPackage: 'MonorepoTools.installPackage',

	/** Install all workspace `Packages` */
	installAllPackages: 'MonorepoTools.installAllPackages',

	/** Open Package Picker: Find a `Package` to install into the `Selected Project` */
	installProjectPackage: 'MonorepoTools.installProjectPackage',

	/** Set `Active Project` */
	setProject: 'MonorepoTools.setProject',

	/** Run the `Selected Project` or `Active Project` */
	runProject: 'MonorepoTools.runProject',

	/** Go to the `Selected Project`'s _package.json_ file */
	goToProject: 'MonorepoTools.goToProject',

	/** Build all `Projects` */
	buildProjects: 'MonorepoTools.buildProjects',

	/** Refresh `Dependencies Tree` */
	refreshDependencies: 'MonorepoTools.refreshDependencies',

	/** Do nothing */
	doNothing: 'MonorepoTools.clickPackageManager'
};

function createCommandFn(subscriptions: subscriptions) {
	return async <T>(commandId: string, command: (args: T) => void) => {
		const allCommands = await VSCodeCommands.getCommands();
		if (!allCommands.includes(commandId))
			subscriptions.push(VSCodeCommands.registerCommand(commandId, command));
	};
}

export { commands, createCommandFn };
