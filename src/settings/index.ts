import { workspace } from 'vscode';

import { Settings } from '../models';


function getSettings() {
	return {
		annotations: getSetting('annotations'),
		hideAnnotations: getSetting('hideAnnotations'),
		packageManager: getSetting('packageManager'),
		runScript: getSetting('runScriptName'),
		buildScript: getSetting('buildScriptName')
	} as Settings;
}

function getSetting<T>(key: string) {
	return getConfiguration().get<T>(key);
}
async function updateSetting<T>(key: string, value: T) {
	await getConfiguration().update(key, value, false);
}
function getConfiguration() {
	return workspace.getConfiguration('MonorepoTools');
}

export { getSettings, getSetting, updateSetting };
