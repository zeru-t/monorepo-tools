import { Memento } from 'vscode';


class AppState {
	public workspaceState: Memento;

	public get currentProject() { return this.workspaceState.get<string>('project'); }

	constructor(workspaceState: Memento) {
		this.workspaceState = workspaceState;
	}

	public setCurrentProject(newProject: string) {
		return this.workspaceState.update('project', newProject);
	}
}

export { AppState };
