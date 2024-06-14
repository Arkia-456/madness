class Formula {
	constructor(formula) {
		this.raw = formula;
	}

	compute(values) {
		try {
			this.computed = this._replacePlaceholder(this.raw, values);
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
}

export { Formula };
