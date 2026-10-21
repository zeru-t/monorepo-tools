import { ExtensionContext, Memento, Uri, window } from 'vscode';

import { AppInfo } from '../appInfo';
import { DependencyTree, DependencyTreeDataProvider, TreeItem } from '../dependencyTree';
import { ProjectQuickPickItem, ProjectQuickPickItems, QuickPick } from '../quickPickItem';
import { StatusBar } from '../statusBar';
import { runScriptCommand } from '../terminal';


/** Set _project state variable_ and update the `Dependency Tree` and `Status Bar`. */
async function setProject(workspaceState: Memento, statusBar: StatusBar, dependencyTreeDataProvider: DependencyTreeDataProvider, newProject: string) {
	await workspaceState.update('project', newProject);
	statusBar.updateProjectStatusBarItems();
	dependencyTreeDataProvider.update(workspaceState);
}

/** Open _package.json_ file for the selected `Project` in the `Dependency Tree`. */
async function goToProject(dependencyTree: DependencyTree, treeItem: TreeItem) {
	await dependencyTree.focusItem(treeItem);
	await window.showTextDocument(Uri.file(treeItem.path));
}

/** Call _run_ script for the selected `Project` in the `Dependency Tree` (will also update _project state variable_). */
async function runProject(workspaceState: Memento, statusBar: StatusBar, dependencyTreeDataProvider: DependencyTreeDataProvider, treeItem: TreeItem) {
	await setProject(workspaceState, statusBar, dependencyTreeDataProvider, treeItem.name);
	await runScriptCommand(workspaceState, 'run', treeItem);
}

/** Open a QuickPick to select a `Project`. */
function selectProject(extensionContext: ExtensionContext, statusBar: StatusBar, dependencyTreeDataProvider: DependencyTreeDataProvider, appInfo: AppInfo) {
	const { workspaceState } = extensionContext;

	const picker = window.createQuickPick() as QuickPick;
	picker.busy = true;
	picker.enabled = false;

	picker.onDidChangeSelection(async ([picked]: readonly ProjectQuickPickItem[]) => {
		if (!picked.project?.projectName)
			return;
		await setProject(workspaceState, statusBar, dependencyTreeDataProvider, picked.project.projectName);
		picker.dispose();
	});

	const items = Object.entries(Object.groupBy(appInfo.projects, ({ folder }) => folder))
		.flatMap(([folder, projects]) => ProjectQuickPickItems.create(extensionContext, folder, projects!));
	picker.items = items;
	picker.activeItems = items.filter(item => item.active);
	picker.placeholder = 'Select a project...';

	picker.busy = false;
	picker.enabled = true;
	picker.show();
}

export { setProject, goToProject, runProject, selectProject };
