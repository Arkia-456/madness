import { Formula } from '../../utils/index.js';

class CheckMadness {
	static async roll(context) {
		const roll = {};
		roll.critOutcome = await CheckMadness._rollCrit(
			context.actor.critRate.total,
		);
		if (context.rollType === 'spell') {
			roll.outcome = await CheckMadness._rollDamage(
				context.item.system.damage,
				context.actor.attributesTotals,
			);
		}
		return roll;
	}

	static async _rollCrit(critRate) {
		const formula = CONFIG.Madness.Default.RollFormula;
		const roll = await new Roll(formula).roll();
		const critFailureScore = CONFIG.Madness.Default.CriticalFailureRate;
		const critSuccessScore = 100 - critRate;
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

	static _rollDamage(itemDamage, actorAttributes) {
		const formulaStr = Formula.generateFormulaStr(itemDamage, true);
		if (!formulaStr) return null;
		const formula = new Formula(formulaStr).compute(actorAttributes);
		return new Roll(formula.computed).roll();
	}
}

export { CheckMadness };
