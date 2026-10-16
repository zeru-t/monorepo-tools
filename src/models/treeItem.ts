import { project } from './project';

interface TreeItemProps {
	projects: project[];
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
