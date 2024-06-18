import { Formula } from '../../utils/index.js';

class CheckMadness {
	static async roll(context) {
		const formula =
			context?.modifiers?.reduce((f, mod) => {
				if (mod.name === 'increaseCritRate') {
					if (f.length) f += ' + ';
					f += mod.formula;
				}
				return f;
			}, '') ?? '';
		const mod =
			new Formula(formula).evaluate({
				...context.actor.magicsTotals,
				...context,
			}).evaluated ?? 0;
		const critRate = context.actor.critRate.total + mod;
		const roll = {};
		roll.critOutcome = await CheckMadness._rollCrit(critRate);
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
