import { MarkdownString } from 'vscode';
import { undefinable } from './generics';


type statusBarItemTooltip = string | MarkdownString;

interface statusBarItemUpdate {
	text?: string;
	icon?: string;
	tooltip?: statusBarItemTooltip;
}

type updateStatusBarItem = () => undefinable<statusBarItemUpdate | Promise<undefinable<statusBarItemUpdate>>>;

interface statusBarItemProps {
	text?: string;
	icon?: string;
	tooltip?: statusBarItemTooltip;
	command?: string;
	priority: number;
	updateStatusBarItem?: updateStatusBarItem;
}

export { statusBarItemProps, statusBarItemTooltip, statusBarItemUpdate, updateStatusBarItem };
