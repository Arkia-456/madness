import { displayError, Formula } from '../../../utils/index.js';
import { CheckMadness } from '../../system/check.js';
import { ItemMadness } from '../index.js';

class SkillMadness extends ItemMadness {
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

	get passives() {
		return (
			Object.values(this.system.items ?? []).reduce((arr, effect) => {
				const effects = structuredClone(
					CONFIG.Madness.Effect[effect.name]?.Effects,
				);
				if (effects) {
					for (const e of effects) {
						if (
							effect.system.hasStrength &&
							effect.system.strength !== null &&
							e.formula
						) {
							e.formula = new Formula(e.formula)
								.evaluate({
									mod: effect.system.strength,
								})
								.evaluated.toString();
						}
					}
					arr.push(...effects);
				}
				return arr;
			}, []) ?? []
		);
	}

	getPassiveModifier(modifierName, options = {}) {
		try {
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
			return new Formula(formula).evaluate(options).evaluated ?? 0;
		} catch (error) {
			displayError('Madness.Message.Error.PassiveModifierEvaluation', {
				modifierName: modifierName,
			});
		}
	}

	updateItems(items) {
		return this.update({ 'system.items': items });
	}

	applyEffects(actor = this.actor) {
		if (this.passives.some((p) => p.name === 'removeStatusEffects')) {
			const actorStatusEffects = actor.effects;
			if (actorStatusEffects) {
				return actor.toggleStatusEffects(
					actorStatusEffects.map((e) => e.system.slug),
				);
			}
		}
	}

	async applyBuffs(actor = this.actor) {
		const buffs = {};
		buffs.addTempHP = this.tempHPMod;
		for (const [key, value] of Object.entries(buffs)) {
			await actor[key]?.(value);
		}
	}

	checkBeforeRoll() {
		return true;
	}

	getContext() {
		return {
			actor: this.actor,
			item: this,
			modifiers: {
				critRate: this.critRateMod,
				critFailureRate: this.criFailureRateMod,
				damage: this.damageMod,
			},
			passives: this.passives,
		};
	}

	removeResources() {
		throw new Error('Method not implemented.');
	}

	async roll(options = {}) {
		if (!this.checkBeforeRoll()) return;
		const context = {
			...options,
			...this.getContext(),
		};
		const roll = await CheckMadness.roll(context);
		if (roll.critOutcome.result === 'success') {
			if (options.removeResources) this.removeResources();
			await this.applyEffects();
			await this.applyBuffs();
		}
		this.toMessage({ context, roll });
	}
}

export { SkillMadness };
