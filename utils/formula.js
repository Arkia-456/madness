class Formula {
	constructor(formula) {
		this.raw = formula;
	}

	compute(values) {
		try {
			this.computed = this._replacePlaceholder(this.raw, values);
			return this;
		} catch (error) {
			console.error(`Error computing expression: ${this.raw}`, error);
			return null;
		}
	}

	evaluate(values) {
		try {
			this.computed ??= this._replacePlaceholder(this.raw, values);
			this.evaluated = this._evaluateExpression(this.computed);
			return this;
		} catch (error) {
			console.error(`Error evaluating expression: ${this.raw}`, error);
			return null;
		}
	}

	_replacePlaceholder(str, values) {
		return str.replace(/@\{([^}]+)\}/g, (match, p) => values[p] ?? match);
	}

	_evaluateExpression(expr) {
		return new Function(`return ${expr}`)();
	}

	static generateFormulaStr(
		attributeDice,
		withDecoration = false,
		calculable = false,
	) {
		return Object.entries(attributeDice).reduce((f, [attr, value]) => {
			if (!value) return f;
			if (f.length) f += ' + ';
			const attrString = withDecoration ? '@{' + attr + '}' : ' ' + attr;
			return (f +=
				attr === 'flat'
					? value
					: `${value}${calculable ? '*' : 'd'}${attrString}`);
		}, '');
	}

	static generateCalculableFormula(attributeDice) {
		return Formula.generateFormulaStr(attributeDice, true, true);
	}
}

export { Formula };
