import { displayError } from '../../../utils/index.js';
import { SkillMadness } from '../skill/index.js';

class SpellMadness extends SkillMadness {
	get cost() {
		return Math.max(0, Number(this.system.cost.value) + this.costMod);
	}

	get passives() {
		const effectPassives = super.passives;
		const magicPassives =
			Object.entries(this.system.requirements).reduce((arr, magic) => {
				if (magic[1].id) {
					const magicId = magic[1].id;
					const effects = CONFIG.Madness.magic[magicId]?.effects;
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

	get tooltip() {
		return {
			...super.tooltip,
			magics: this._magicsTooltip,
		};
	}

	get _magicsTooltip() {
		return Object.values(this.system.requirements).reduce((magics, m) => {
			if (m.id) {
				const magicConfig = foundry.utils.deepClone(
					CONFIG.Madness.magics[m.id],
				);
				magics[m.id] = magicConfig;
				if (magicConfig.effects) {
					magics[m.id].effects = magicConfig.effects.map((e) => {
						const modifier = this.getPassiveModifier(e.name);
						return {
							name: e.name,
							value: isNaN(modifier) ? '' : modifier,
						};
					});
				}
			}
			return magics;
		}, {});
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
		displayError('Madness.Message.Error.NotEnoughMP');
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
