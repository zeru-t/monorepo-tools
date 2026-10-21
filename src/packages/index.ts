import { execSync } from 'child_process';

import { window, QuickPickItem, ExtensionContext } from 'vscode';

import { AppInfo } from '../appInfo';
import { TreeItem } from '../dependencyTree';
import { packageSearchResult } from '../models';
import { ProjectQuickPickItem, QuickPickSteps, ProjectQuickPickItems, PackageQuickPickItem, QuickPick } from '../quickPickItem';
import { runTerminalCommand } from '../terminal';


function installAllPackages() {
	runTerminalCommand('install');
}
function installPackage(extensionContext: ExtensionContext, appInfo: AppInfo) {
	const picker = window.createQuickPick() as QuickPick;
	picker.busy = true;
	picker.enabled = false;
	picker.debounce = {
		id: 0,
		timeout: {} as NodeJS.Timeout
	};

	picker.onDidChangeSelection(([picked]: readonly ProjectQuickPickItem[]) => {
		switch (picker.step) {
			case QuickPickSteps.ProjectSelection:
				showPackageSearch(picker, picked);
				break;
			case QuickPickSteps.PackageSearch:
				installPackageInFolder(picker, picked);
				break;
		}
	});
	picker.onDidChangeValue(searchForPackage(picker));

	picker.placeholder = 'Select a project to install package(s) into...';
	picker.totalSteps = 2;
	picker.step = 1;

	const items = [
		...ProjectQuickPickItems.createRoot(extensionContext),
		...Object.entries(Object.groupBy(appInfo.projects, ({ folder }) => folder))
			.flatMap(([folder, projects]) => ProjectQuickPickItems.create(extensionContext, folder, projects!))
	];
	picker.items = items;
	picker.activeItems = items.filter(item => item.active);

	picker.busy = false;
	picker.enabled = true;
	picker.show();
}
function installProjectPackage(treeItem: TreeItem) {
	const picker = window.createQuickPick() as QuickPick;
	picker.busy = true;
	picker.enabled = false;
	picker.step = QuickPickSteps.PackageSearch;
	picker.debounce = {
		id: 0,
		timeout: {} as NodeJS.Timeout
	};

	picker.onDidChangeSelection(installPackageInFolderFn(picker));
	picker.onDidChangeValue(searchForPackage(picker));

	picker.project = treeItem.project!;
	picker.placeholder = `Search for a package to install into '${treeItem.label}'`;
	picker.items = [];
	picker.value = '';

	picker.busy = false;
	picker.enabled = true;
	picker.show();
}

function installPackageInFolder(picker: QuickPick, picked?: PackageQuickPickItem) {
	if (!picked)
		return;

	const { id, label } = picked;
	const { project } = picker;
	if (!label || !project || id === -1)
		return;

	picker.dispose();
	runTerminalCommand(`install ${label}`, `./${project.folder}/${project.projectName}`);
}
function installPackageInFolderFn(picker: QuickPick) {
	return ([picked]: readonly ProjectQuickPickItem[]) => {
		installPackageInFolder(picker, picked);
	};
}
function searchForPackage(picker: QuickPick) {
	return (text: string) => {
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
	};
}
function showPackageSearch(picker: QuickPick, picked?: ProjectQuickPickItem) {
	if (!picked)
		return;

	const { id, project } = picked;
	if (!project)
		return;

	if (id === -1) {
		picker.dispose();
		installAllPackages();
		return;
	}

	picker.project = project;
	picker.step = QuickPickSteps.PackageSearch;
	picker.placeholder = `Search for a package to install into '${project.projectName}'`;
	picker.items = [];
	picker.value = '';
}

export { installAllPackages, installPackage, installProjectPackage };
