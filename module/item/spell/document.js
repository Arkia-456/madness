import { Formula, capitalizeFirstLetter } from '../../../utils/index.js';
import { CheckMadness } from '../../system/check.js';
import { ItemMadness } from '../index.js';

class SpellMadness extends ItemMadness {
	get cost() {
		return Number(this.system.cost.value) + this.costMod;
	}

	get passives() {
		return (
			Object.entries(this.system.requirements).reduce((arr, magic) => {
				if (magic[1].id) {
					const magicId = capitalizeFirstLetter(magic[1].id);
					const effects = CONFIG.Madness.Magic[magicId]?.Effects;
					if (effects) arr.push(...effects);
				}
				return arr;
			}, []) ?? []
		);
	}

	get nbMagics() {
		return Object.values(this.system.requirements).filter((el) => el.id).length;
	}

	get costMod() {
		return this.getPassiveModifier('decreaseMPCost');
	}

	get critRateMod() {
		return this.getPassiveModifier('increaseCritRate');
	}

	get criFailureRateMod() {
		return this.getPassiveModifier('increaseCritFailureRate');
	}

	get damageMod() {
		return this.getPassiveModifier('increaseDamage');
	}

	get tempHPMod() {
		return this.getPassiveModifier('addTempHP');
	}

	getPassiveModifier(modifierName) {
		const formula =
			this.passives.reduce((f, mod) => {
				if (mod.name === modifierName) {
					const sign = modifierName.startsWith('decrease') ? '-' : '+';
					const value = `${sign}${mod.formula}`;
					if (f.length) f += ' + ';
					f += value;
				}
				return f;
			}, '') ?? '';
		return (
			new Formula(formula).evaluate({
				...this.actor.magicsTotals,
				...{ nbMagics: this.nbMagics },
			}).evaluated ?? 0
		);
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
		context.nbMagics = this.nbMagics;
		context.modifiers = {
			critRate: this.critRateMod,
			critFailureRate: this.criFailureRateMod,
			damage: this.damageMod,
		};
		this.context = context;
		if (!this.checkMP()) {
			const notEnoughMPErrorMsg = game.i18n.localize(
				'Madness.Message.Error.NotEnoughMP',
			);
			return ui.notifications.error(notEnoughMPErrorMsg);
		}
		const roll = await CheckMadness.roll(context);
		if (roll.critOutcome.result === 'success') {
			this.actor.removeMP(this.cost);
			await this.applyBuffs();
		}
		this.toMessage({ context, roll });
	}

	checkMP(actor = this.actor) {
		return actor.currentMP >= this.cost;
	}

	async applyBuffs(actor = this.actor) {
		const buffsModifiers = this.passives.filter((m) => m.type === 'buff');
		if (!buffsModifiers.length) return;
		const buffs = {};
		buffs.addTempHP = this.tempHPMod;
		for (const [key, value] of Object.entries(buffs)) {
			await actor[key]?.(value);
		}
	}
}

export { SpellMadness };
