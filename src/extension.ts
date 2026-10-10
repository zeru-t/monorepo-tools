import { ExtensionContext, languages, commands as VSCodeCommands, EventEmitter, CodeLensProvider, tasks, Task, TaskScope, ShellExecution } from 'vscode';

import { AnnotationProvider, AnnotationCommandsProvider } from './annotations/provider';
import { commands } from './commands';
import { updateSetting, getSettings } from './settings';
import { StatusBarItems } from './statusBarItem';


export function activate({ subscriptions }: ExtensionContext) {

	const updateAnnotationProvider = new EventEmitter<void>();

	createCommands();

	createCodeLenses();

	const statusBarItems = new StatusBarItems(subscriptions);


	function createCodeLenses() {
		createCodeLens(new AnnotationCommandsProvider());
		createCodeLens(new AnnotationProvider(updateAnnotationProvider));


		function createCodeLens(provider: CodeLensProvider) {
			const codeLens = languages.registerCodeLensProvider({ language: 'json', pattern: '**/package.json' }, provider);
			subscriptions.push(codeLens);
		}
	}

	function createCommands() {
		createCommand(commands.toggleHideAnnotations, toggleHideAnnotations);
		createCommand(commands.changePackageManager, updatePackageManager);
		createCommand(commands.installPackages, runCommand('install'));

		createCommand(commands.doNothing, () => null);


		async function createCommand<T>(commandId: string, command: (args: T) => void) {
			const allCommands = await VSCodeCommands.getCommands();
			if (!allCommands.includes(commandId))
				subscriptions.push(VSCodeCommands.registerCommand(commandId, command));
		}

		async function toggleHideAnnotations() {
			const { hideAnnotations } = getSettings();
			await updateSetting('hideAnnotations', !hideAnnotations);
			updateAnnotationProvider.fire();
		}

		async function updatePackageManager(newPackageManager: string) {
			const { packageManager } = getSettings();
			if (newPackageManager === packageManager)
				return;
			await updateSetting('packageManager', newPackageManager);
			statusBarItems.packageManager.update();
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
	}
}
