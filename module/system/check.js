import { Formula } from '../../utils/index.js';

class CheckMadness {
	static async roll(context) {
		const options = {};
		options.critRate = (() => {
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
			return context.actor.critRate.total + mod;
		})();
		options.critFailureRate = (() => {
			const formula =
				context?.modifiers?.reduce((f, mod) => {
					if (mod.name === 'increaseCritFailureRate') {
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
			return mod;
		})();
		const roll = {};
		roll.critOutcome = await CheckMadness._rollCrit(options);
		if (context.rollType === 'spell') {
			const additionalDamageFormula =
				context?.modifiers?.reduce((f, mod) => {
					if (mod.name === 'increaseDamage') {
						if (f.length) f += ' + ';
						f += mod.formula;
					}
					return f;
				}, '') ?? '';
			const additionalDamageModifier =
				new Formula(additionalDamageFormula).evaluate({
					...context.actor.magicsTotals,
					...context,
				}).evaluated ?? 0;
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
		const critFailureScore =
			CONFIG.Madness.Default.CriticalFailureRate +
			(options?.critFailureRate ?? 0);
		const critSuccessScore = 100 - (options?.critRate ?? 0);
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
