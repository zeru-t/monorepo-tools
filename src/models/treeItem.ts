import { project } from './project';

interface treeItemProps {
	projects: project[];
	extensionPath: string;
	name: string;
	path?: string;
	collapsible?: boolean;
	tooltip?: string;
	description?: string;
	context?: string;
	icon?: string;
	project?: project;
}

export { treeItemProps };
