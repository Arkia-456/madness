import { Formula } from '../../../utils/index.js';
import { CheckModifiersDialogMadness } from './dialog.js';

class CheckMadness {
	static async _beforeRoll(context = {}) {
		await CheckMadness._askIncreaseDamageWithMPCost(context);
		const dialogModifiers = context.promptModifiers
			? await CheckMadness.askModifiers(context)
			: {};
		if (Object.keys(dialogModifiers).length) {
			context.modifiers = this._mergeModifiers(
				context.modifiers,
				dialogModifiers,
			);
		}
	}

	static async roll(context) {
		await CheckMadness._beforeRoll(context);
		const options = {};
		const roll = {};
		options.critRate = {
			actorCritRate: context.actor.critRate.total,
			mod: context.modifiers?.critRate ?? 0,
		};
		options.critFailureRate =
			context.actor.criticalFailureRateMod +
			(context.modifiers?.critFailureRate ?? 0);
		roll.critOutcome = await CheckMadness._rollCrit(options);
		if (context.rollType === 'spell' || context.rollType === 'weapon') {
			const additionalDamageModifier = context.modifiers?.damage;
			roll.outcome = await CheckMadness._rollDamage(
				context.item.system.damage,
				additionalDamageModifier,
				context.actor.attributesTotals,
			);
		}
		return roll;
	}

	static async askModifiers(context) {
		const check = {};
		await new Promise((resolve) => {
			new CheckModifiersDialogMadness(check, resolve, context).render(true);
		});
		return check;
	}

	static _mergeModifiers(modifiers1 = {}, modifiers2 = {}) {
		const attributes = [
			...new Set([...Object.keys(modifiers1), ...Object.keys(modifiers2)]),
		];
		return attributes.reduce((modifiers, attr) => {
			modifiers[attr] =
				Number(modifiers1[attr] ?? 0) + Number(modifiers2[attr] ?? 0);
			return modifiers;
		}, {});
	}

	static async _askIncreaseDamageWithMPCost(context = {}) {
		const increaseDamageWithMPCostPassive = context?.passives?.find(
			(p) => p.name === 'increaseDamageWithMPCost',
		);
		if (
			context.item &&
			increaseDamageWithMPCostPassive &&
			context.actor?.checkMP(increaseDamageWithMPCostPassive.cost)
		) {
			const increaseDamageWithMPCostModifier = context.item.getPassiveModifier(
				'increaseDamageWithMPCost',
			);
			const confirm = await Dialog.confirm({
				title: 'test',
				content: game.i18n.format('Madness.Dialog.OverloadEffectMessage', {
					value: increaseDamageWithMPCostModifier,
				}),
			});
			if (!confirm) return;

			context.modifiers.damage += increaseDamageWithMPCostModifier;
			context.actor.removeMP(increaseDamageWithMPCostPassive.cost);
		}
	}

	static async _rollCrit(options = {}) {
		const formula = CONFIG.Madness.default.rollFormula;
		const roll = await new Roll(formula).roll();
		const critFailureScore = new Formula(
			CONFIG.Madness.formulas.scores.criticalFailure,
		).evaluate({ mod: options?.critFailureRate }).evaluated;
		const critSuccessScore = new Formula(
			CONFIG.Madness.formulas.scores.critical,
		).evaluate(options.critRate).evaluated;
		const result = CheckMadness._getCritResult(
			roll.total,
			critFailureScore,
			critSuccessScore,
		);
		const isCritical = result !== 'success' ? 1 : 0;
		return { roll, result, isCritical };
	}

	static _getCritResult(value, critFailScore, critSuccessScore) {
		return value <= critFailScore
			? 'criticalFailure'
			: value > critSuccessScore
				? 'criticalSuccess'
				: 'success';
	}

	static _rollDamage(itemDamage, modifier, actorAttributes) {
		const formulaStr = Formula.generateFormulaStrFromDice(
			itemDamage,
			modifier,
			true,
		);
		if (!formulaStr) return null;
		const formula = new Formula(formulaStr).compute(actorAttributes);
		return new Roll(formula.computed).roll();
	}
}

export { CheckMadness };
