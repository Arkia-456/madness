import { displayError, Formula } from '../../../utils/index.js';
import { CheckMadness } from '../../system/check/check.js';
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

	get tooltip() {
		const damageFormula =
			Formula.generateFormulaStrFromDice(this.system.damage, this.damageMod) ||
			'0';
		const criticalFailureMod =
			this.criFailureRateMod + this.actor.criticalFailureRateMod;
		const criticalFailureScore = new Formula(
			CONFIG.Madness.formulas.scores.criticalFailure,
		).evaluate({ mod: criticalFailureMod }).evaluated;
		const criticalSuccessScore = new Formula(
			CONFIG.Madness.formulas.scores.critical,
		).evaluate({
			actorCritRate: this.actor.system.secondaryAttributes.critRate.total,
			mod: this.critRateMod,
		}).evaluated;
		return {
			damageFormula,
			criticalFailureScore,
			criticalSuccessScore,
			effects: this.system.items,
			system: this.system,
		};
	}

	get range() {
		return Math.max(0, Number(this.system.range.value) + this.rangeMod);
	}

	get rangeMod() {
		return this.getPassiveModifier('increaseRange');
	}

	get statusEffects() {
		return Object.values(this.system.items ?? []).reduce((arr, itemEffect) => {
			const statusEffectSlug = itemEffect.system.statusEffect;
			if (statusEffectSlug) {
				const statusEffect = CONFIG.Madness.statusEffects[statusEffectSlug];
				if (statusEffect) arr.push({ slug: statusEffectSlug, ...statusEffect });
			}
			return arr;
		}, []);
	}

	get parryEffects() {
		const effects = Object.values(this.system.items ?? []).filter(
			(itemEffect) => {
				if (
					CONFIG.Madness.effect[itemEffect.system.slug]?.effects?.some(
						(e) => e.name === 'preventParry',
					)
				) {
					return itemEffect;
				}
			},
		);
		return { canParry: !effects.length, effects: effects };
	}

	get dodgeEffects() {
		const effects = Object.values(this.system.items ?? []).filter(
			(itemEffect) => {
				if (
					CONFIG.Madness.effect[itemEffect.system.slug]?.effects?.some(
						(e) => e.name === 'preventDodge',
					)
				) {
					return itemEffect;
				}
			},
		);
		return { canDodge: !effects.length, effects: effects };
	}

	get passives() {
		return (
			Object.values(this.system.items ?? []).reduce((arr, effect) => {
				const effects = structuredClone(
					CONFIG.Madness.effect[effect.system.slug]?.effects,
				);
				if (effects) {
					for (const e of effects) {
						if (
							effect.system.hasStrength &&
							effect.system.strength !== null &&
							effect.system.strength !== undefined &&
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

	async applyEffects(actor = this.actor) {
		if (this.passives.some((p) => p.name === 'removeStatusEffects')) {
			const actorStatusEffects = actor.effects;
			if (actorStatusEffects) {
				await actor.toggleStatusEffects(
					actorStatusEffects.map((e) => e.system.slug),
				);
			}
		}
		await actor.toggleStatusEffects(
			this.statusEffects.reduce((effects, statusEffect) => {
				if (statusEffect.target === 'self') effects.push(statusEffect.slug);
				return effects;
			}, []),
		);
	}

	async applyBuffs(actor = this.actor) {
		const buffs = {};
		buffs.addTempHP = this.tempHPMod;
		for (const [key, value] of Object.entries(buffs)) {
			await actor[key]?.(value);
		}
	}

	beforeRoll() {}

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
		await this.beforeRoll();
		const context = foundry.utils.mergeObject(this.getContext(), {
			...options,
			formulaAttributes: ['damage', 'critRate', 'critFailureRate'],
		});
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
