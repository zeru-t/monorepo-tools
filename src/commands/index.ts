import { subscriptions } from '../models';

import { commands as VSCodeCommands } from 'vscode';


const commands = {
	showTerminal: 'workbench.action.terminal.focus',
	toggleHideAnnotations: 'MonorepoTools.toggleHideAnnotations',
	changePackageManager: 'MonorepoTools.changePackageManager',
	installPackage: 'MonorepoTools.installPackage',
	installAllPackages: 'MonorepoTools.installAllPackages',
	installProjectPackage: 'MonorepoTools.installProjectPackage',
	setProject: 'MonorepoTools.setProject',
	runProject: 'MonorepoTools.runProject',
	buildProjects: 'MonorepoTools.buildProjects',
	refreshDependencies: 'MonorepoTools.refreshDependencies',
	goToProject: 'MonorepoTools.goToProject',

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
