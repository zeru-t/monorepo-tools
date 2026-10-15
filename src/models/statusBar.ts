import { MarkdownString } from 'vscode';


type statusBarItemTooltip = string | MarkdownString;

interface statusBarItemUpdate {
	text?: string;
	icon?: string;
	tooltip?: statusBarItemTooltip;
}

type updateStatusBarItem = () => statusBarItemUpdate | Promise<statusBarItemUpdate | undefined> | undefined;

interface statusBarItemProps {
	text?: string;
	icon?: string;
	tooltip?: statusBarItemTooltip;
	command?: string;
	priority: number;
	updateStatusBarItem?: updateStatusBarItem;
}

export { statusBarItemProps, statusBarItemTooltip, statusBarItemUpdate, updateStatusBarItem };
