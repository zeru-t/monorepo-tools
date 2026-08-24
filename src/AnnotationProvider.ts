import { CodeLens, CodeLensProvider, TextDocument } from 'vscode';

import { getSettings } from './settings';


class AnnotationProvider implements CodeLensProvider {

	public async provideCodeLenses(document: TextDocument) {
		const { annotations } = getSettings();
		if (!annotations)
			return [];

		const documentText = document.getText();
		const scriptsTextMatch = /(.+"scripts":\s*{[\r\n]+\s*)(.+?)(\s*})/gs.exec(documentText);
		if (scriptsTextMatch?.length !== 4)
			return [];

		const scriptsLineNumber = scriptsTextMatch[1].split('\n').length - 1;
		const scripts = scriptsTextMatch[2];
		return scripts
			.split('\n')
			.reduce<CodeLens[]>(createCodeLens, []);


		function createCodeLens(list: CodeLens[], script: string, index: number) {
			const scriptNameMatch = /"(.+)(": ".+")/g.exec(script.trim());
			if (scriptNameMatch?.length === 3) {
				const scriptName = scriptNameMatch[1];
				const annotation = annotations[scriptName];
				if (annotation) {
					const { range } = document.lineAt(scriptsLineNumber + index);
					list.push(new CodeLens(range, {
						title: annotation,
						tooltip: `Update annotation for '${scriptName}' script`,
						command: 'workbench.action.openSettings',
						arguments: ['MonorepoTools.annotations']
					}));
				}
			}
			return list;
		}
	}
}

export { AnnotationProvider };
