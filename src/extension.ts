import { ExtensionContext, languages, StatusBarAlignment, window, commands, EventEmitter, CodeLensProvider } from 'vscode';

import { AnnotationProvider, AnnotationCommandsProvider } from './annotations/provider';
import { updateSetting, getSettings } from './settings';


export function activate({ subscriptions }: ExtensionContext) {

	const updateAnnotationProvider = new EventEmitter<void>();

	createCommand('MonorepoTools.toggleHideAnnotations', toggleHideAnnotations);

	createStatusBarItem('Terminal', '$(terminal-cmd) Terminal', 'Show Terminal', 'workbench.action.terminal.focus', 1);

	createCodeLens(new AnnotationCommandsProvider());
	createCodeLens(new AnnotationProvider(updateAnnotationProvider));


	async function createCommand<T>(commandId: string, command: (args: T) => void) {
		const allCommands = await commands.getCommands();
		if (!allCommands.includes(commandId))
			subscriptions.push(commands.registerCommand(commandId, command));
	}

	function createStatusBarItem(id: string, text: string, tooltip: string, command: string, priority: number) {
		const statusBarItem = window.createStatusBarItem(id, StatusBarAlignment.Left, priority);
		statusBarItem.text = text;
		statusBarItem.name = `Monorepo Tools - ${id}`;
		statusBarItem.tooltip = tooltip;
		statusBarItem.command = command;
		statusBarItem.show();
		subscriptions.push(statusBarItem);
	}

	function createCodeLens(provider: CodeLensProvider) {
		const codeLens = languages.registerCodeLensProvider({ language: 'json', pattern: '**/package.json' }, provider);
		subscriptions.push(codeLens);
	}

	async function toggleHideAnnotations() {
		const { hideAnnotations } = getSettings();
		await updateSetting('hideAnnotations', !hideAnnotations);
		updateAnnotationProvider.fire();
	}
}
