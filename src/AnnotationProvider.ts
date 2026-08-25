import { CodeLens as VSCodeCodeLens, CodeLensProvider, Command, TextDocument, window } from 'vscode';

import { getSettings } from './settings';


const DEFAULT_TITLE = 'Add Annotations';
const DEFAULT_TOOLTIP = 'Click here to add annotations';
class AnnotationProvider implements CodeLensProvider {

	public async provideCodeLenses(document: TextDocument) {
		const documentText = document.getText();
		const scriptsTextMatch = /(.+"scripts":\s*{[\r\n]+\s*)(.+?)(\s*})/gs.exec(documentText);
		if (scriptsTextMatch?.length !== 4)
			return [];

		const scriptsLineNumber = scriptsTextMatch[1].split('\n').length - 1;
		const { annotations } = getSettings();
		if (!annotations)
			return [];

		const scripts = scriptsTextMatch[2];
		const codeLenses = scripts.split('\n').reduce<CodeLens[]>(createCodeLens, []);

		if (codeLenses.length)
			return codeLenses;

		return new CodeLens(scriptsLineNumber - 1).asArray();


		function createCodeLens(list: CodeLens[], script: string, index: number) {
			const scriptNameMatch = /"(.+)(": ".+")/g.exec(script.trim());
			if (scriptNameMatch?.length === 3) {
				const scriptName = scriptNameMatch[1];
				const annotation = annotations[scriptName];
				if (annotation)
					list.push(new CodeLens(scriptsLineNumber + index, annotation, scriptName));
			}
			return list;
		}
	}
}

class CodeLens extends VSCodeCodeLens {
	constructor(lineNumber: number, annotation?: string, scriptName?: string) {
		const { range } = window.activeTextEditor!.document.lineAt(lineNumber);
		const command = {
			title: annotation ?? DEFAULT_TITLE,
			tooltip: scriptName ? `Click here to update annotation for '${scriptName}' script` : DEFAULT_TOOLTIP,
			command: 'workbench.action.openSettings',
			arguments: ['MonorepoTools.annotations']
		} as Command;
		super(range, command);
	}

	public asArray() { return [this]; }
}

export { AnnotationProvider };
