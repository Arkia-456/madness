import { Formula } from '../../utils/index.js';

class CheckMadness {
	static async roll(context) {
		const options = {};
		const roll = {};
		options.critRate = {
			actorCritRate: context.actor.critRate.total,
			mod: context.modifiers?.critRate ?? 0,
		};
		options.critFailureRate = context.modifiers?.critFailureRate ?? 0;
		roll.critOutcome = await CheckMadness._rollCrit(options);
		if (context.rollType === 'spell') {
			const additionalDamageModifier = context.modifiers?.damage;
			roll.outcome = await CheckMadness._rollDamage(
				context.item.system.damage,
				additionalDamageModifier,
				context.actor.attributesTotals,
			);
		}
		return roll;
	}

	static async _rollCrit(options = {}) {
		const formula = CONFIG.Madness.Default.RollFormula;
		const roll = await new Roll(formula).roll();
		const critFailureScore = new Formula(
			CONFIG.Madness.Formulas.Scores.criticalFailure,
		).evaluate({ mod: options?.critFailureRate }).evaluated;
		const critSuccessScore = new Formula(
			CONFIG.Madness.Formulas.Scores.critical,
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
