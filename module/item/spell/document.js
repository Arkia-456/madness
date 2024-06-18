import { capitalizeFirstLetter } from '../../../utils/index.js';
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
			rollType: 'spell',
		};
		context.nbMagics = 0;
		const modifiers = Object.entries(this.system.requirements).reduce(
			(arr, magic) => {
				if (magic[1].id) {
					context.nbMagics += 1;
					const magicId = capitalizeFirstLetter(magic[1].id);
					const effects = CONFIG.Madness.Magic[magicId]?.Effects;
					if (effects) arr.push(...effects);
				}
				return arr;
			},
			[],
		);
		context.modifiers = modifiers;
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
