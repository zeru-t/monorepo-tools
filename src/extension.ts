import { ExtensionContext, commands as VSCodeCommands, EventEmitter, QuickPickOptions, window, ShellExecution, TaskScope, Task, tasks, workspace, Uri, TextEditor } from 'vscode';

import { AnnotationProvider, AnnotationCommandsProvider, createCodeLenses } from './annotations';
import { AppInfo } from './appInfo';
import { commands } from './commands';
import { DependencyTreeDataProvider, TreeItem } from './dependencies';
import { PackageMangerItems } from './packageManager';
import { getSettings, updateSetting } from './settings';
import { StatusBar } from './statusBar';
import './extensions';


export async function activate(extensionContext: ExtensionContext) {

	const root = workspace.workspaceFolders?.[0]?.uri.path;
	if (!root)
		return;

	const { subscriptions, workspaceState } = extensionContext;

	const updateAnnotationProvider = new EventEmitter<void>();

	const appInfo = await AppInfo.create();

	const dependencyTreeDataProvider = new DependencyTreeDataProvider(extensionContext, appInfo);
	const dependencyTree = window.createTreeView('monorepo-dependencies', { treeDataProvider: dependencyTreeDataProvider });

	createCommands();

	createCodeLenses(extensionContext, new AnnotationCommandsProvider(), new AnnotationProvider(updateAnnotationProvider));

	const statusBar = new StatusBar(extensionContext, appInfo.projects);

	window.onDidChangeActiveTextEditor(async (textEditor?: TextEditor) => {
		if (!textEditor)
			return;
		const { document } = textEditor;
		const selectedApp = appInfo.projects.find(({ path }) => path === document.uri.fsPath);
		if (!selectedApp)
			return;
		const treeItem = dependencyTreeDataProvider.TreeItems
			.flatMap(item => item.children)
			.find(item => item?.id === selectedApp.appName);
		if (!treeItem)
			return;
		await dependencyTree.reveal(treeItem, { select: true });
	});

	function createCommands() {

		createCommand(commands.toggleHideAnnotations, toggleHideAnnotations);
		createCommand(commands.changePackageManager, changePackageManager);
		createCommand(commands.installPackages, runCommand('install'));
		createCommand(commands.setApp, setApp);
		createCommand(commands.runApp, runScriptCommand('run'));
		createCommand(commands.buildApp, runScriptCommand('build'));
		createCommand(commands.refreshDependencies, dependencyTreeDataProvider.refresh());
		createCommand(commands.goToProject, ({ path }: TreeItem) => window.showTextDocument(Uri.file(path)));

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
			await statusBar.updateStatusBarItems('packageManager');
		}

		async function setApp(newApp: string) {
			await workspaceState.update('app', newApp);
			await statusBar.updateAppStatusBarItems();
			await dependencyTreeDataProvider.refresh()();
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
	}
}
