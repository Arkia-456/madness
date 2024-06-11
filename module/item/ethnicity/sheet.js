import ItemSheetMadness from '../sheet.js';

export default class EthnicitySheetMadness extends ItemSheetMadness {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.template = 'systems/madness/templates/item/ethnicity/sheet.hbs';
		return options;
	}
}
