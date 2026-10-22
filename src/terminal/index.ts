import { window, ShellExecution, Task, TaskScope, tasks, Memento } from 'vscode';

import { TreeItem } from '../dependencyTree';
import { getSettings } from '../settings';


function runScriptCommand(workspaceState: Memento, commandName: 'run' | 'build', title: string, isMonorepo: boolean, treeItem?: TreeItem) {
	const projectName = treeItem?.name ?? workspaceState.get<string>('project');
	const settings = getSettings();
	const command = settings[`${commandName}Script`];
	const isRunCommand = isMonorepo && commandName === 'run';
	if (isRunCommand && !projectName)
		return window.showWarningMessage('You must first select a project to run...');
	return runTerminalCommand(`run ${isRunCommand ? `${command}:${projectName}` : command}`, title);
}

function runTerminalCommand(command: string, title: string, directory?: string) {
	const { packageManager } = getSettings();
	if (!packageManager)
		return;

	const taskDefinition = { type: 'MonorepoTools' };
	const execution = new ShellExecution(`${packageManager} ${command}`, { cwd: directory });
	const task = new Task(taskDefinition, TaskScope.Workspace, title, 'MonorepoTools', execution);
	tasks.executeTask(task);
}

export { runScriptCommand, runTerminalCommand };
