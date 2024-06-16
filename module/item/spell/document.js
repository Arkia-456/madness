import { CheckMadness } from '../../system/check.js';
import { ItemMadness } from '../index.js';

class SpellMadness extends ItemMadness {
	get cost() {
		return this.system.cost.value;
	}

	async updateItems(items) {
		await this.update({ 'system.items': items });
	}

	async roll() {
		const context = {
			actor: this.actor,
			item: this,
		};
		if (!this.checkMP()) {
			const notEnoughMPErrorMsg = game.i18n.localize(
				'Madness.Message.Error.NotEnoughMP',
			);
			return ui.notifications.error(notEnoughMPErrorMsg);
		}
		const roll = await CheckMadness.roll(context);
		if (roll.critOutcome.result === 'success') {
			this.actor.removeMP(this.cost);
		}
		this.toMessage({ roll });
	}

	checkMP(actor = this.actor) {
		return actor.currentMP >= this.cost;
	}
}

export { SpellMadness };
