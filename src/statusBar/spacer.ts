import { subscriptions } from '../models';
import { StatusBarItem } from './item';


class StatusBarSpacer {
	constructor(subscriptions: subscriptions, priority: number, numSpaces = 1) {
		for (let i = 0; i < numSpaces; i++) {
			const spacer = new StatusBarItem({ text: ' ', priority });
			spacer.initialize(subscriptions);
		}
	}
}


export { StatusBarSpacer };
