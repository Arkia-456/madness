import { ItemSheetMadness } from '../index.js';

class SpellSheetMadness extends ItemSheetMadness {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.template = 'systems/madness/templates/item/spell/sheet.hbs';
		return options;
	}

	async getData(options) {
		const sheetData = await super.getData(options);
		sheetData.config = {
			attributes: CONFIG.Madness.Attributes,
			magics: CONFIG.Madness.Magics,
		};
		return sheetData;
	}
}

export { SpellSheetMadness };
