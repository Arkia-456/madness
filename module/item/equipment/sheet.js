import { ItemSheetMadness } from '../index.js';

class EquipmentSheetMadness extends ItemSheetMadness {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.template = 'systems/madness/templates/item/equipment/sheet.hbs';
		return options;
	}

	async getData(options) {
		const sheetData = await super.getData(options);
		sheetData.config = {
			slots: CONFIG.Madness.Equipment.Slots,
		};
		return sheetData;
	}
}

export { EquipmentSheetMadness };
