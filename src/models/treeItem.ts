import { project } from './project';

interface treeItemProps {
	projects: project[];
	extensionPath: string;
	label: string;
	path?: string;
	collapsible?: boolean;
	tooltip?: string;
	description?: string;
	contextValue?: string;
	icon?: string;
	project?: project;
}

export { treeItemProps };
