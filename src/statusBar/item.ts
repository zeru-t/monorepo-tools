import { StatusBarAlignment, window, StatusBarItem as VSCodeStatusBarItem } from 'vscode';

import { Subscriptions, StatusBarItemProps, UpdateStatusBarItem } from '../models';


class StatusBarItem {

	public statusBarItem: VSCodeStatusBarItem;
	public updateStatusBarItem?: UpdateStatusBarItem;

	constructor({ priority, text = '', icon, tooltip, command, updateStatusBarItem }: StatusBarItemProps) {
		this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 4000 - priority);

		this.statusBarItem.name = 'Monorepo Tools';
		this.statusBarItem.text = `${icon ? `$(${icon})` : ''}${text ? ` ${text}` : ''}`;
		this.statusBarItem.tooltip = tooltip;

		if (command)
			this.statusBarItem.command = command;

		if (priority < 4)
			this.statusBarItem.color = '#d2b5dd';

		this.updateStatusBarItem = updateStatusBarItem;

		this.statusBarItem.show();
	}

	public initialize(subscriptions: Subscriptions) {
		subscriptions.push(this.statusBarItem);
		this.update();
	}

	public async update() {
		if (!this.updateStatusBarItem)
			return;
		const updateResponse = await this.updateStatusBarItem();
		if (!updateResponse)
			return;
		const { text, icon, tooltip } = updateResponse;
		if (text || icon) {
			const regex = new RegExp(/^(\$\((.*)\)) (.*)$/);
			const [currentIcon, currentText] = regex.exec(this.statusBarItem.text)!.slice(-2);
			const newIcon = icon || currentIcon;
			const newText = text || currentText;
			this.statusBarItem.text = `${newIcon ? `$(${newIcon})` : ''} ${newText ? ` ${newText}` : ''}`;
		}
		if (tooltip)
			this.statusBarItem.tooltip = tooltip;
	}

}

export { StatusBarItem };
