import { CodeLensProvider, Event, EventEmitter, TextDocument, CodeLens as VSCodeLens, ExtensionContext, languages, window } from 'vscode';

import { getSettings, updateSetting } from '../settings';


class AnnotationProvider implements CodeLensProvider {

	constructor(eventEmitter?: EventEmitter<void>) {
		if (eventEmitter)
			this.onDidChangeCodeLenses = eventEmitter.event;
	}

	public onDidChangeCodeLenses?: Event<void>;

	public provideCodeLenses(document: TextDocument) {
		const documentText = document.getText();
		const scriptsTextMatch = /(.+"scripts":\s*{[\r\n]+\s*)(.+?)(\s*})/gs.exec(documentText);
		if (scriptsTextMatch?.length !== 4)
			return [];

		const scriptsLineNumber = scriptsTextMatch[1].split('\n').length - 1;
		const { annotations, hideAnnotations } = getSettings();

		const scripts = scriptsTextMatch[2];
		const codeLenses = scripts.split('\n').reduce<CodeLens[]>(createCodeLens, []);

		return codeLenses;


		function createCodeLens(list: CodeLens[], script: string, index: number) {
			const scriptNameMatch = /"(.+)(": ".+")/g.exec(script.trim());
			if (!hideAnnotations && scriptNameMatch?.length === 3) {
				const scriptName = scriptNameMatch[1];
				const annotation = annotations[scriptName];
				if (annotation)
					list.push(new CodeLens(scriptsLineNumber + index, annotation));
			}
			return list;
		}
	}
}

class AnnotationCommandsProvider implements CodeLensProvider {

	public provideCodeLenses(document: TextDocument) {
		const documentText = document.getText();
		const scriptsTextMatch = /(.+"scripts":\s*{[\r\n]+\s*)(.+?)(\s*})/gs.exec(documentText);
		if (scriptsTextMatch?.length !== 4)
			return [];

		const scriptsLineNumber = scriptsTextMatch[1].split('\n').length - 1;
		const { hideAnnotations } = getSettings();

		const showHideText = hideAnnotations ? 'Show' : 'Hide';
		const addAnnotationsCodeLens = new CodeLens(scriptsLineNumber - 1, 'Add/Update Annotations', 'add/update', 'workbench.action.openSettings', 'MonorepoTools.annotations');
		const toggleAnnotationsCodeLens = new CodeLens(scriptsLineNumber - 1, `${showHideText} Annotations`, showHideText.toLowerCase(), 'MonorepoTools.toggleHideAnnotations');

		return [
			toggleAnnotationsCodeLens,
			addAnnotationsCodeLens
		];
	}
}

class CodeLens extends VSCodeLens {
	constructor(lineNumber: number, title: string, tooltipText = '', command = '', ...args: string[]) {
		const { range } = window.activeTextEditor!.document.lineAt(lineNumber);
		const tooltip = command ? `Click here to ${tooltipText} annotations` : undefined;
		super(range, { title, tooltip, command, arguments: args });
	}
}

function createCodeLenses({ subscriptions }: ExtensionContext, ...providers: CodeLensProvider[]) {
	providers.forEach(provider => subscriptions.push(languages.registerCodeLensProvider({ language: 'json', pattern: '**/package.json' }, provider)));
}

async function toggleHideAnnotations(updateAnnotationProvider: EventEmitter<void>) {
	const { hideAnnotations } = getSettings();
	await updateSetting('hideAnnotations', !hideAnnotations);
	updateAnnotationProvider.fire();
}

export { AnnotationProvider, AnnotationCommandsProvider, createCodeLenses, toggleHideAnnotations };
