import { ItemSheetMadness } from '../index.js';

class WeaponSheetMadness extends ItemSheetMadness {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.template = 'systems/madness/templates/item/weapon/sheet.hbs';
		return options;
	}

	async getData(options) {
		const sheetData = await super.getData(options);
		sheetData.config = {
			attributes: Object.fromEntries(
				Object.entries(CONFIG.Madness.Attributes).filter(([key, value]) =>
					CONFIG.Madness.PrimaryAttributes.includes(key),
				),
			),
			modules: CONFIG.Madness.Modules,
		};
		return sheetData;
	}
}

export { WeaponSheetMadness };
