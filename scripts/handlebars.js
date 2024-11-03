import { Formula } from '../utils/index.js';

function registerHandlebarsHelpers() {
	Handlebars.registerHelper('getRollResult', (minMax, attrDice, attributes) => {
		return createFormula(attrDice, attributes, minMax);
	});

	Handlebars.registerHelper('lower', (translationKey) => {
		return game.i18n.localize(translationKey).toLowerCase();
	});

	Handlebars.registerHelper('upper', (translationKey) => {
		return game.i18n.localize(translationKey).toUpperCase();
	});

	Handlebars.registerHelper('times', (n, options) => {
		let accum = '';
		for (let i = 0; i < n; i++) {
			accum += options.fn(this);
		}
		return accum;
	});

	Handlebars.registerHelper('add', (a, b) => {
		if (isNaN(a) || isNaN(b)) {
			throw new TypeError('One of the arguments is not a number');
		}
		return Number(a) + Number(b);
	});

	Handlebars.registerHelper('minus', (a, b) => {
		if (isNaN(a) || isNaN(b)) {
			throw new TypeError('One of the arguments is not a number');
		}
		return Number(a) - Number(b);
	});
}

function createFormula(attrDice, attributes, minMax) {
	const formula = Formula.generateCalculableFormulaFromDice(attrDice);
	const values = {};
	Object.entries(attributes).forEach(
		([attr, value]) => (values[attr] = minMax === 'max' ? value.total : 1),
	);
	return new Formula(formula).evaluate(values).evaluated;
}

export { registerHandlebarsHelpers };
