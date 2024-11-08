import { capitalizeFirstLetter } from '../../../utils/index.js';
import { SkillMadness } from '../skill/index.js';

class SpellMadness extends SkillMadness {
	get cost() {
		return Number(this.system.cost.value) + this.costMod;
	}

	get passives() {
		const effectPassives = super.passives;
		const magicPassives =
			Object.entries(this.system.requirements).reduce((arr, magic) => {
				if (magic[1].id) {
					const magicId = capitalizeFirstLetter(magic[1].id);
					const effects = CONFIG.Madness.Magic[magicId]?.Effects;
					if (effects) arr.push(...effects);
				}
				return arr;
			}, []) ?? [];
		return [...magicPassives, ...effectPassives];
	}

	get nbMagics() {
		return Object.values(this.system.requirements).filter((el) => el.id).length;
	}

	get costMod() {
		return this.getPassiveModifier('decreaseMPCost');
	}

	getPassiveModifier(modifierName, options = {}) {
		const opt = {
			...options,
			...this.actor.magicsTotals,
			...{ nbMagics: this.nbMagics },
		};
		return super.getPassiveModifier(modifierName, opt);
	}

	async roll(options = {}) {
		return super.roll({
			...options,
			rollType: 'spell',
			nbMagics: this.nbMagics,
			removeResources: true,
		});
	}

	checkBeforeRoll() {
		if (this.checkMP()) return true;
		const notEnoughMPErrorMsg = game.i18n.localize(
			'Madness.Message.Error.NotEnoughMP',
		);
		ui.notifications.error(notEnoughMPErrorMsg);
		return false;
	}

	removeResources() {
		this.actor.removeMP(this.cost);
	}

	checkMP(actor = this.actor) {
		return actor.currentMP >= this.cost;
	}
}

export { SpellMadness };
