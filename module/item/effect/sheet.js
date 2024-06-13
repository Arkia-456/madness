import { ItemSheetMadness } from '../index.js';

class EffectSheetMadness extends ItemSheetMadness {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.template = 'systems/madness/templates/item/effect/sheet.hbs';
		return options;
	}

	async getData(options) {
		const sheetData = await super.getData(options);
		sheetData.config = {
			magics: CONFIG.Madness.Magics,
		};
		return sheetData;
	}
}

export { EffectSheetMadness };
