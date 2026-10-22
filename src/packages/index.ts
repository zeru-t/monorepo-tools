import { execSync } from 'child_process';

import { window, QuickPickItem, ExtensionContext, Uri, workspace } from 'vscode';

import { AppInfo } from '../appInfo';
import { TreeItem } from '../dependencyTree';
import { packageSearchResult, undefinable } from '../models';
import { ProjectQuickPickItem, QuickPickSteps, ProjectQuickPickItems, PackageQuickPickItem, QuickPick } from '../quickPickItem';
import { runTerminalCommand } from '../terminal';


/** Install all workspace `Project` dependencies. */
function installAllPackages() {
	runTerminalCommand('install', 'Install All Packages');
}

/** Open a QuickPick to select a `Project` and then search for a `Package` to install into it. */
function installPackage(extensionContext: ExtensionContext, currentProject: undefinable<string>, appInfo: AppInfo) {

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
				showInstallTypeSelector(picker, extensionContext.extensionPath, picked);
				break;
			case QuickPickSteps.InstallTypeSelection:
				installPackageInFolder(picker, appInfo.IsMonorepo, picked);
				break;
		}
	});
	picker.onDidChangeValue(searchForPackage(picker));

	picker.placeholder = 'Select a project to install package(s) into...';
	picker.totalSteps = 3;
	picker.step = QuickPickSteps.ProjectSelection;
	picker.title = 'Install Package: Project Select';

	const items = appInfo.IsMonorepo ?
		ProjectQuickPickItems.createItems(extensionContext, currentProject, appInfo.projects) :
		ProjectQuickPickItems.createForSingleRepo(extensionContext, currentProject);
	picker.items = items;

	const activeItems = items.filter(item => item.active);
	picker.activeItems = activeItems.length ? activeItems : [items.last()!];

	picker.busy = false;
	picker.enabled = true;
	picker.show();
}

/** Open a QuickPick to search for a `Package` to install into the selected `Project`. */
function installProjectPackage(extensionContext: ExtensionContext, appInfo: AppInfo, treeItem: TreeItem) {
	const picker = window.createQuickPick() as QuickPick;
	picker.busy = true;
	picker.enabled = false;
	picker.title = `Install '${treeItem.name}' Package: Package Search`;
	picker.debounce = {
		id: 0,
		timeout: {} as NodeJS.Timeout
	};

	picker.onDidChangeSelection(([picked]: readonly ProjectQuickPickItem[]) => {
		switch (picker.step) {
			case QuickPickSteps.PackageSearch:
				showInstallTypeSelector(picker, extensionContext.extensionPath, picked);
				break;
			case QuickPickSteps.InstallTypeSelection:
				installPackageInFolder(picker, appInfo.IsMonorepo, picked);
				break;
		}
	});
	picker.onDidChangeValue(searchForPackage(picker));

	picker.totalSteps = 3;
	picker.step = QuickPickSteps.PackageSearch;
	picker.project = treeItem.project!;
	picker.placeholder = `Search for a package to install into '${treeItem.name}'`;
	picker.items = [];
	picker.value = '';

	picker.busy = false;
	picker.enabled = true;
	picker.show();
}

function installPackageInFolder(picker: QuickPick, isMonorepo: boolean, picked?: PackageQuickPickItem) {
	if (!picked)
		return;

	const { id, label } = picked;
	const { project, packageName } = picker;
	if (!label || !project || id === -1)
		return;

	const isDevDependency = label === 'devDependency';
	picker.dispose();
	const title = `Install '${packageName}' into '${project.packageName ?? workspace.name}' (${isDevDependency ? 'devDependency' : 'dependency'})`;
	runTerminalCommand(`install ${packageName}${isDevDependency ? ' -D' : ''}`, title, isMonorepo ? `./${project.folder}/${project.projectName}` : undefined);
}
function searchForPackage(picker: QuickPick) {
	return (text: string) => {
		if (picker.step === QuickPickSteps.ProjectSelection || picker.step === QuickPickSteps.InstallTypeSelection)
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
				id: -1,
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
	picker.title = 'Install Package: Package Search';
	picker.placeholder = `Search for a package to install into '${project.projectName}'`;
	picker.items = [];
	picker.value = '';
}
function showInstallTypeSelector(picker: QuickPick, extensionPath: string, picked?: ProjectQuickPickItem) {
	if (!picked || picked.id === -1)
		return;

	picker.packageName = picked.label;
	picker.step = QuickPickSteps.InstallTypeSelection;
	picker.title = 'Install Package: Install Type';
	picker.placeholder = 'Select an install type...';
	picker.items = [
		{ label: 'dependency', description: 'install as a dependency', iconPath: Uri.file(`${extensionPath}/icons/dependency.svg`) },
		{ label: 'devDependency', description: 'install as a devDependency', iconPath: Uri.file(`${extensionPath}/icons/devDependency.svg`) }
	];
	picker.value = '';
}

export { installAllPackages, installPackage, installProjectPackage };
