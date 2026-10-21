import { Memento, TreeView, Uri, window } from 'vscode';

import { TreeItem } from '../dependencyTree';
import { StatusBar } from '../statusBar';


async function setProject(workspaceState: Memento, statusBar: StatusBar, newProject: string) {
	await workspaceState.update('project', newProject);
	await statusBar.updateProjectStatusBarItems();
}

async function goToProject(dependencyTree: TreeView<TreeItem>, treeItem: TreeItem) {
	await dependencyTree.reveal(treeItem, { select: true, focus: true });
	await window.showTextDocument(Uri.file(treeItem.path));
}

export { setProject, goToProject };
