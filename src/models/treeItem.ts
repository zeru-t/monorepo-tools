import { appInfo } from './appInfo';

interface TreeItemProps {
	appInfo: appInfo[];
	extensionPath: string;
	label: string;
	path?: string;
	collapsible?: boolean;
	tooltip?: string;
	description?: string;
	contextValue?: string;
	icon?: string;
}

export { TreeItemProps };
