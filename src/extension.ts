import { ExtensionContext, languages, commands as VSCodeCommands, EventEmitter, CodeLensProvider, tasks, Task, TaskScope, ShellExecution, window, QuickPickOptions } from 'vscode';

import { AnnotationProvider, AnnotationCommandsProvider } from './annotations/provider';
import { commands } from './commands';
import { PackageMangerItems } from './packageManagerItem';
import { updateSetting, getSettings } from './settings';
import { StatusBar } from './statusBarItem';


export function activate(extensionContext: ExtensionContext) {

	const { subscriptions, workspaceState } = extensionContext;

	const updateAnnotationProvider = new EventEmitter<void>();

	createCommands();

	createCodeLenses();

	const statusBar = new StatusBar(extensionContext);


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
		createCommand(commands.changePackageManager, changePackageManager);
		createCommand(commands.installPackages, runCommand('install'));
		createCommand(commands.setApp, setApp);
		createCommand(commands.runApp, runAppCommand('runScriptName'));
		createCommand(commands.buildApp, runAppCommand('buildScriptName'));

		createCommand(commands.doNothing, () => null);


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

		function runAppCommand(commandName: keyof ReturnType<typeof getSettings>) {
			const appName = workspaceState.get<string>('app');
			const settings = getSettings();
			const command = settings[commandName];
			return runCommand(`run ${appName ? `${command}:${appName}` : command}`);
		}
	}
}
