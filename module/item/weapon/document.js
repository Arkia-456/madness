import { Formula, capitalizeFirstLetter } from '../../../utils/index.js';
import { CheckMadness } from '../../system/check.js';
import { ItemMadness } from '../index.js';

class WeaponMadness extends ItemMadness {
	prepareBaseData() {
		super.prepareBaseData();
		if (this.system.ammo.value === undefined) {
			this.update({ 'system.ammo.value': this.system.ammo.max });
		}
	}

	get passives() {
		const modulePassives =
			Object.entries(this.system.modules).reduce((arr, module) => {
				if (module[1].id) {
					const moduleId = capitalizeFirstLetter(module[1].id);
					const effects = CONFIG.Madness.Modules[moduleId]?.Effects;
					if (effects) arr.push(...effects);
				}
				return arr;
			}, []) ?? [];
		const effectPassives =
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
			}, []) ?? [];
		return [...modulePassives, ...effectPassives];
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
			return new Formula(formula).evaluate().evaluated ?? 0;
		} catch (error) {
			const passiveModifierEvaluationErrorMsg = game.i18n.format(
				'Madness.Message.Error.PassiveModifierEvaluation',
				{
					modifierName: modifierName,
				},
			);
			ui.notifications.error(passiveModifierEvaluationErrorMsg);
		}
	}

	async updateItems(items) {
		await this.update({ 'system.items': items });
	}

	reload() {
		this.update({ 'system.ammo.value': this.system.ammo.max });
	}

	async roll() {
		const context = {
			actor: this.actor,
			item: this,
			rollType: 'weapon',
		};
		context.modifiers = {
			critRate: this.critRateMod,
			critFailureRate: this.criFailureRateMod,
			damage: this.damageMod,
		};
		context.passives = this.passives;
		if (!this.checkAmmo()) {
			const notEnoughAmmoErrorMsg = game.i18n.localize(
				'Madness.Message.Error.NotEnoughAmmo',
			);
			return ui.notifications.error(notEnoughAmmoErrorMsg);
		}
		const roll = await CheckMadness.roll(context);
		if (roll.critOutcome.result === 'success') {
			this.removeAmmo();
			await this.applyEffects();
			await this.applyBuffs();
		}
		this.toMessage({ context, roll });
	}

	checkAmmo() {
		return this.system.ammo.value > 0;
	}

	removeAmmo() {
		this.update({ 'system.ammo.value': this.system.ammo.value - 1 });
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
}

export { WeaponMadness };
