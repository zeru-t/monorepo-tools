import { execSync } from 'child_process';

import { commands as VSCodeCommands, EventEmitter, ExtensionContext, ShellExecution, Task, tasks, TaskScope, TextEditor, Uri, QuickPickItem, QuickPickOptions, window, workspace } from 'vscode';

import { AnnotationProvider, AnnotationCommandsProvider, createCodeLenses } from './annotations';
import { AppInfo } from './appInfo';
import { commands } from './commands';
import { DependencyTreeDataProvider, TreeItem } from './dependencies';
import { packageSearchResult } from './models';
import { PackageMangerItems } from './packageManager';
import { PackageQuickPickItem, ProjectQuickPickItem, ProjectQuickPickItems, QuickPick, QuickPickSteps } from './quickPickItem';
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
		createCommand(commands.installPackages, installPackages);
		createCommand(commands.setApp, setApp);
		createCommand(commands.runApp, runScriptCommand('run'));
		createCommand(commands.buildApp, runScriptCommand('build'));
		createCommand(commands.refreshDependencies, dependencyTreeDataProvider.refreshFn());
		createCommand(commands.goToProject, goToProject);

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

		async function installPackages() {
			const picker = window.createQuickPick() as QuickPick;
			picker.busy = true;
			picker.enabled = false;
			picker.debounce = {
				id: 0,
				timeout: {} as NodeJS.Timeout
			};

			picker.onDidChangeSelection(([picked]: readonly ProjectQuickPickItem[]) => {
				if (!picked)
					return;

				const { id, label, project } = picked;
				if (picker.step === QuickPickSteps.ProjectSelection) {
					if (!project)
						return;

					if (id === -1) {
						picker.dispose();
						runCommand('install');
						return;
					}

					picker.project = project.appName;
					picker.step = QuickPickSteps.PackageSearch;
					picker.placeholder = `Search for a package to install into '${project.appName}'`;
					picker.items = [];
					picker.value = '';
				}
				else if (picker.step === QuickPickSteps.PackageSearch) {
					if (!label || id === -1)
						return;

					picker.dispose();
					runCommand(`install ${label}`, './apps/bump-version');
				}
			});

			picker.onDidChangeValue(text => {
				if (picker.step !== QuickPickSteps.PackageSearch)
					return;

				picker.busy = true;
				if (picker.debounce.timeout)
					clearTimeout(picker.debounce.timeout);

				if (!text) {
					picker.items = [];
					picker.busy = false;
					picker.debounce.id = 0;
					return;
				}
				else if (picker.debounce.id == 0) {
					picker.items = [{
						label: '$(search)',
						description: 'searching...',
						alwaysShow: true
					}];
				}

				picker.debounce.timeout = setTimeout(async () => {
					const id = ++picker.debounce.id;

					const results = JSON.parse(execSync(`npm search '${text}' --json`).toString()) as packageSearchResult[];

					if (id !== picker.debounce.id)
						return;

					if (!results.length)
						picker.items = [{ id: -1, label: 'No results found!', detail: 'Try a different search term...', alwaysShow: true }];
					else
						picker.items = results.map<QuickPickItem>(result => new PackageQuickPickItem(result));

					picker.busy = false;
					picker.debounce.id = 0;
				}, 500);
			});

			picker.placeholder = 'Select a project to install package(s) into...';
			picker.totalSteps = 2;
			picker.step = 1;

			const apps = [
				...ProjectQuickPickItems.createRoot(extensionContext),
				...Object.entries(Object.groupBy(appInfo.projects, ({ folder }) => folder))
					.flatMap(([folder, apps]) => ProjectQuickPickItems.create(extensionContext, folder, apps!))
			];
			picker.items = apps;
			picker.activeItems = apps.filter(item => item.active);

			picker.busy = false;
			picker.enabled = true;
			picker.show();
		}

		async function setApp(newApp: string) {
			await workspaceState.update('app', newApp);
			await statusBar.updateAppStatusBarItems();
		}

		async function goToProject(treeItem: TreeItem) {
			await dependencyTree.reveal(treeItem, { select: true, focus: true });
			await window.showTextDocument(Uri.file(treeItem.path));
		}

		function runScriptCommand(commandName: 'run' | 'build') {
			const appName = workspaceState.get<string>('app');
			const settings = getSettings();
			const command = settings[`${commandName}Script`];
			return runCommandFn(`run ${appName ? `${command}:${appName}` : command}`);
		}

		function runCommandFn(command: string) { return () => runCommand(command); }
		function runCommand(command: string, directory?: string) {
			const { packageManager } = getSettings();
			if (!packageManager)
				return;

			const taskDefinition = { type: 'MonorepoTools' };
			const execution = new ShellExecution(`${packageManager} ${command}`, { cwd: directory });
			const task = new Task(taskDefinition, TaskScope.Workspace, command, 'MonorepoTools', execution);
			tasks.executeTask(task);
		}
	}
}
