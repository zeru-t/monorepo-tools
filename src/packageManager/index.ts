import { ExtensionContext, IconPath, QuickPickItem, QuickPickOptions, Uri, window } from 'vscode';

import { getSettings, updateSetting } from '../settings';
import { StatusBar } from '../statusBar';


class PackageMangerItem implements QuickPickItem {
	public label: string;
	public description?: string;
	public iconPath?: IconPath;
	constructor(extensionContext: ExtensionContext, name: string) {
		const { packageManager } = getSettings();
		this.label = ` ${name}`;
		this.iconPath = Uri.file(`${extensionContext.extensionPath}/icons/${name}.png`);
		if (name === packageManager)
			this.description = '\t(currently selected)';
	}
}

class PackageMangerItems {
	public items: PackageMangerItem[];
	constructor(extensionContext: ExtensionContext) {
		const { packageManager } = getSettings();
		this.items = [
			new PackageMangerItem(extensionContext, 'npm'),
			new PackageMangerItem(extensionContext, 'pnpm'),
			new PackageMangerItem(extensionContext, 'bun')
		].sort(({ label }) => label.trim() === packageManager ? -1 : 1);
	}
}

async function changePackageManager(extensionContext: ExtensionContext, statusBar: StatusBar) {
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

export { changePackageManager };
