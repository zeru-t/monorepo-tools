import { ExtensionContext, commands as VSCodeCommands, EventEmitter, tasks, Task, TaskScope, ShellExecution, window, QuickPickOptions } from 'vscode';

import { PackageMangerItems } from '../packageManager';
import { getSettings, updateSetting } from '../settings';
import { StatusBar } from '../statusBar';


const commands = {
	showTerminal: 'workbench.action.terminal.focus',
	toggleHideAnnotations: 'MonorepoTools.toggleHideAnnotations',
	changePackageManager: 'MonorepoTools.changePackageManager',
	installPackages: 'MonorepoTools.installPackages',
	setApp: 'MonorepoTools.setApp',
	runApp: 'MonorepoTools.runApp',
	buildApp: 'MonorepoTools.buildApp',

	doNothing: 'MonorepoTools.clickPackageManager'
};

function useCommands(extensionContext: ExtensionContext, updateAnnotationProvider: EventEmitter<void>, statusBar: StatusBar) {

	const { subscriptions, workspaceState } = extensionContext;

	async function createCommand<T>(commandId: string, command: (args: T) => void) {
		const allCommands = await VSCodeCommands.getCommands();
		if (!allCommands.includes(commandId))
			subscriptions.push(VSCodeCommands.registerCommand(commandId, command));
	}

	async function toggleHideAnnotations() {
		const { hideAnnotations } = getSettings();
		await updateSetting('annotations.hide', !hideAnnotations);
		updateAnnotationProvider.fire();
	}

	async function changePackageManager() {
		const { items } = new PackageMangerItems(extensionContext);
		const quickPickOptions = {
			matchOnDescription: true,
			matchOnDetail: true,
			placeHolder: 'Select a Package Manager to switch to...'
		} as QuickPickOptions;

		const picked = await window.showQuickPick(items, quickPickOptions);

		const newPackageManager = picked?.label.trim();
		if (!newPackageManager)
			return;

		await updateSetting('packageManager', newPackageManager);
		await statusBar.packageManager.update();
	}

	async function setApp(newApp: string) {
		await workspaceState.update('app', newApp);
		await statusBar.updateAppStatusBarItems();
	}

	function runCommand(command: string) {
		return () => {
			const { packageManager } = getSettings();
			if (!packageManager)
				return;

			const taskDefinition = { type: 'MonorepoTools' };
			const execution = new ShellExecution(`${packageManager} ${command}`);
			const task = new Task(taskDefinition, TaskScope.Workspace, command, 'MonorepoTools', execution);
			tasks.executeTask(task);
		};
	}

	function runScriptCommand(commandName: 'run' | 'build') {
		const appName = workspaceState.get<string>('app');
		const settings = getSettings();
		const command = settings[`${commandName}Script`];
		return runCommand(`run ${appName ? `${command}:${appName}` : command}`);
	}

	return {
		createCommand,
		toggleHideAnnotations,
		changePackageManager,
		setApp,
		runCommand,
		runScriptCommand
	};
}

export { commands, useCommands };
