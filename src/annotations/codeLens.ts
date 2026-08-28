import { CodeLens as BaseCodeLens, window } from 'vscode';


class CodeLens extends BaseCodeLens {
	constructor(lineNumber: number, title: string, tooltipText = '', command = '', ...args: string[]) {
		const { range } = window.activeTextEditor!.document.lineAt(lineNumber);
		const tooltip = `Click here to ${tooltipText} annotations`;
		super(range, { title, tooltip, command, arguments: args });
	}
}

export { CodeLens };
