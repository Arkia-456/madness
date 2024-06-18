import { Formula, capitalizeFirstLetter } from '../../../utils/index.js';
import { CheckMadness } from '../../system/check.js';
import { ItemMadness } from '../index.js';

class SpellMadness extends ItemMadness {
	get cost() {
		const formula =
			this.context.modifiers?.reduce((f, mod) => {
				if (mod.name === 'increaseMPCost' || mod.name === 'decreaseMPCost') {
					const sign = mod.name === 'decreaseMPCost' ? '-' : '+';
					const value = `${sign}${mod.formula}`;
					if (f.length) f += ' + ';
					f += value;
				}
				return f;
			}, '') ?? '';
		const mod =
			new Formula(formula).evaluate({
				...this.context.actor.magicsTotals,
				...this.context,
			}).evaluated ?? 0;
		return Number(this.system.cost.value) + mod;
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
		const modifiers = this.passives;
		context.modifiers = modifiers;
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
		const buffsModifiers = this.context.modifiers.filter(
			(m) => m.type === 'buff',
		);
		if (!buffsModifiers.length) return;
		const buffs = {};
		buffs.addTempHP = (() => {
			const formula =
				buffsModifiers.reduce((f, buff) => {
					if (buff.name === 'addTempHP') {
						if (f.length) f += ' + ';
						f += buff.formula;
					}
					return f;
				}, '') ?? '';
			const mod =
				new Formula(formula).evaluate({
					...this.context.actor.magicsTotals,
					...this.context,
				}).evaluated ?? 0;
			return mod;
		})();
		for (const [key, value] of Object.entries(buffs)) {
			await actor[key]?.(value);
		}
	}
}

export { SpellMadness };
