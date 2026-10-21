import { Memento, Uri, window } from 'vscode';

import { DependencyTree, TreeItem } from '../dependencyTree';
import { StatusBar } from '../statusBar';


async function setProject(workspaceState: Memento, statusBar: StatusBar, newProject: string) {
	await workspaceState.update('project', newProject);
	await statusBar.updateProjectStatusBarItems();
}

async function goToProject(dependencyTree: DependencyTree, treeItem: TreeItem) {
	await dependencyTree.focusItem(treeItem);
	await window.showTextDocument(Uri.file(treeItem.path));
}

export { setProject, goToProject };
