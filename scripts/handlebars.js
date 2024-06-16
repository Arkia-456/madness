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
}

function createFormula(attrDice, attributes, minMax) {
	const formula = Formula.generateCalculableFormula(attrDice);
	const values = {};
	Object.entries(attributes).forEach(
		([attr, value]) => (values[attr] = minMax === 'max' ? value.total : 1),
	);
	return new Formula(formula).evaluate(values).evaluated;
}

export { registerHandlebarsHelpers };
