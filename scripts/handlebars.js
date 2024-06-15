import { Formula } from '../utils/index.js';

function registerHandlebarsHelpers() {
	Handlebars.registerHelper('getRollResult', (minMax, attrDice, attributes) => {
		return createFormula(attrDice, attributes, minMax);
	});
}

function createFormula(attrDice, attributes, minMax) {
	const formula = generateFormula(attrDice, attributes);
	const values = {};
	Object.entries(attributes).forEach(
		([attr, value]) => (values[attr] = minMax === 'max' ? value.total : 1),
	);
	return new Formula(formula).compute(values).evaluated;
}

function generateFormula(attrDice) {
	return Object.entries(attrDice).reduce((f, [attr, value]) => {
		if (!value) return f;
		if (f.length) f += ' + ';
		return (f += attr === 'flat' ? value : `${value} * @{${attr}}`);
	}, '');
}

export { registerHandlebarsHelpers };
