import { MarkdownString } from 'vscode';


type StatusBarItemTooltip = string | MarkdownString;

interface StatusBarItemUpdate {
	text?: string;
	icon?: string;
	tooltip?: StatusBarItemTooltip;
}

interface StatusBarItemProps {
	text?: string;
	icon?: string;
	tooltip?: StatusBarItemTooltip;
	command?: string;
	priority: number;
	updateStatusBarItem?: UpdateStatusBarItem;
}

type UpdateStatusBarItem = () => StatusBarItemUpdate | Promise<StatusBarItemUpdate | undefined> | undefined;

export { StatusBarItemProps, StatusBarItemTooltip, StatusBarItemUpdate, UpdateStatusBarItem };
