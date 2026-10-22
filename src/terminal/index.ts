import { window, ShellExecution, Task, TaskScope, tasks } from 'vscode';

import { TreeItem } from '../dependencyTree';
import { undefinable } from '../models';
import { getSettings } from '../settings';


function runScriptCommand(currentProject: undefinable<string>, commandName: 'run' | 'build', title: string, isMonorepo: boolean, treeItem?: TreeItem) {
	const projectName = treeItem?.name ?? currentProject;
	const settings = getSettings();
	const command = settings[`${commandName}Script`];
	const isRunCommand = isMonorepo && commandName === 'run';

	if (isRunCommand && !projectName)
		return window.showWarningMessage('You must first select a project to run...');

	const commandText = isRunCommand ? `${command}:${projectName}` : command;
	return runTerminalCommand(`run ${commandText}`, title);
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
