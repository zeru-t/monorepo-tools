import { workspace } from 'vscode';


type Annotation = Record<string, string>;
interface Settings {
	annotations: Annotation;
}

function getSettings() {
	return {
		annotations: getSetting('annotations')
	} as Settings;
}

function getSetting<T>(key: string) {
	return getConfiguration().get<T>(key);
}
async function updateSetting<T>(key: string, value: T, global = false) {
	await getConfiguration().update(key, value, global);
}
function getConfiguration() {
	return workspace.getConfiguration('MonorepoTools');
}

export { getSettings, getSetting, updateSetting };
