import { ExtensionContext, languages } from 'vscode';

import { AnnotationProvider } from './AnnotationProvider';


export function activate({ subscriptions }: ExtensionContext) {
	const documentSelector = { language: 'json', pattern: '**/package.json' };
	subscriptions.push(languages.registerCodeLensProvider(documentSelector, new AnnotationProvider()));
}
