import { window, ShellExecution, Task, TaskScope, tasks, Memento } from 'vscode';

import { getSettings } from '../settings';


function runScriptCommand(workspaceState: Memento, commandName: 'run' | 'build') {
	return () => {
		const projectName = workspaceState.get<string>('project');
		const settings = getSettings();
		const command = settings[`${commandName}Script`];
		const isRunCommand = commandName === 'run';
		if (isRunCommand && !projectName) {
			return window.showWarningMessage('You must first select a project to run...');
		}
		return runTerminalCommand(`run ${isRunCommand ? `${command}:${projectName}` : command}`);
	};
}

function runTerminalCommand(command: string, directory?: string) {
	const { packageManager } = getSettings();
	if (!packageManager)
		return;

	const taskDefinition = { type: 'MonorepoTools' };
	const execution = new ShellExecution(`${packageManager} ${command}`, { cwd: directory });
	const task = new Task(taskDefinition, TaskScope.Workspace, command, 'MonorepoTools', execution);
	tasks.executeTask(task);
}

export { runScriptCommand, runTerminalCommand };
