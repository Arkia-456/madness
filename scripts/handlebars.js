import { capitalizeFirstLetter, Formula } from '../utils/index.js';

function registerHandlebarsHelpers() {
	Handlebars.registerHelper('and', (a, b) => Boolean(a) && Boolean(b));

	Handlebars.registerHelper('getRollResult', (minMax, attrDice, attributes) => {
		return createFormula(attrDice, attributes, minMax);
	});

	Handlebars.registerHelper('lower', (translationKey) => {
		return game.i18n.localize(translationKey).toLowerCase();
	});

	Handlebars.registerHelper('upper', (translationKey) => {
		return game.i18n.localize(translationKey).toUpperCase();
	});

	Handlebars.registerHelper('capitalize', (str) => {
		return capitalizeFirstLetter(str);
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

	Handlebars.registerHelper('gt', (a, b) => {
		if (isNaN(a) || isNaN(b)) {
			throw new TypeError('One of the arguments is not a number');
		}
		return Number(a) > Number(b);
	});

	Handlebars.registerHelper('localizeAndSort', (obj) => {
		return Object.fromEntries(
			Object.entries(obj).sort(([, translationKey1], [, translationKey2]) => {
				const t1 = game.i18n.localize(translationKey1);
				const t2 = game.i18n.localize(translationKey2);
				if (t1 < t2) {
					return -1;
				}
				if (t1 > t2) {
					return 1;
				}
				return 0;
			}),
		);
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
