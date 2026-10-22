import { EventEmitter, ExtensionContext, TextEditor, window, workspace } from 'vscode';

import { AnnotationProvider, AnnotationCommandsProvider, createCodeLenses, toggleHideAnnotations } from './annotations';
import { AppInfo } from './appInfo';
import { commands, createCommandFn, setContext } from './commands';
import { DependencyTree, DependencyTreeDataProvider, TreeItem } from './dependencyTree';
import { installAllPackages, installPackage, installProjectPackage } from './packages';
import { changePackageManager } from './packageManager';
import { goToProject, selectProject, runProject } from './projects';
import { StatusBar } from './statusBar';
import { runScriptCommand } from './terminal';

import './extensions';

export async function activate(extensionContext: ExtensionContext) {

	const root = workspace.workspaceFolders?.[0]?.uri.path;
	if (!root)
		return;

	const { subscriptions, workspaceState } = extensionContext;

	const updateAnnotationProvider = new EventEmitter<void>();

	const appInfo = await AppInfo.create();

	const dependencyTreeDataProvider = new DependencyTreeDataProvider(extensionContext, appInfo);
	const dependencyTree = new DependencyTree(dependencyTreeDataProvider);

	createCommands();

	createCodeLenses(extensionContext, new AnnotationCommandsProvider(), new AnnotationProvider(updateAnnotationProvider));

	const statusBar = new StatusBar(extensionContext, appInfo);

	window.onDidChangeActiveTextEditor(async (textEditor?: TextEditor) => {
		if (!textEditor)
			return;
		const { document } = textEditor;
		const project = appInfo.projects.find(({ path }) => path === document.uri.fsPath);
		if (!project)
			return;
		const treeItem = dependencyTreeDataProvider.TreeItems
			.flatMap(item => item.children)
			.find(item => item?.name === project.projectName);
		if (!treeItem)
			return;
		await dependencyTree.showItem(treeItem);
	});

	const isMonorepo = appInfo.IsMonorepo;
	if (isMonorepo)
		await setContext('showDependencyTree', true);

	await setContext('dependencyTreeLoaded', true);

	function createCommands() {

		const createCommand = createCommandFn(subscriptions);

		createCommand(commands.toggleHideAnnotations, () => toggleHideAnnotations(updateAnnotationProvider));

		createCommand(commands.changePackageManager, () => changePackageManager(extensionContext, statusBar));

		createCommand(commands.installPackage, () => installPackage(extensionContext, appInfo));
		createCommand(commands.installAllPackages, installAllPackages);
		createCommand(commands.installProjectPackage, (treeItem: TreeItem) => installProjectPackage(extensionContext, appInfo, treeItem));

		createCommand(commands.setProject, () => selectProject(extensionContext, statusBar, dependencyTreeDataProvider, appInfo));
		createCommand(commands.goToProject, (treeItem: TreeItem) => goToProject(dependencyTree, treeItem));
		createCommand(commands.runProject, (treeItem: TreeItem) => runProject(workspaceState, statusBar, dependencyTreeDataProvider, isMonorepo, treeItem));
		createCommand(commands.buildProjects, () => runScriptCommand(workspaceState, 'build', isMonorepo ? 'Build All Projects' : `Build '${workspace.name}'`, isMonorepo));

		createCommand(commands.refreshDependencies, dependencyTreeDataProvider.refresh(workspaceState));

		createCommand(commands.expandTree, dependencyTreeDataProvider.expandAll());
		createCommand(commands.collapseTree, dependencyTreeDataProvider.collapseAll(workspaceState));

		createCommand(commands.doNothing, () => null);
	}
}
