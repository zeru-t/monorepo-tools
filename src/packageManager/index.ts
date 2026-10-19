import { ExtensionContext, IconPath, QuickPickItem, Uri } from 'vscode';

import { getSettings } from '../settings';


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

export { PackageMangerItems };
