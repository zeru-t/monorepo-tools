import { workspace } from 'vscode';


type Annotation = Record<string, string>;
interface Settings {
	annotations: Annotation;
	hideAnnotations: boolean;
}

function getSettings() {
	return {
		annotations: getSetting('annotations'),
		hideAnnotations: getSetting('hideAnnotations')
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
