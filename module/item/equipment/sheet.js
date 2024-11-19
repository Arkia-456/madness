import { ItemSheetMadness } from '../index.js';

class EquipmentSheetMadness extends ItemSheetMadness {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.classes.push('equipment');
		options.hasDetails = true;
		return options;
	}

	async getData(options) {
		const sheetData = await super.getData(options);

		return {
			...sheetData,
			slots: CONFIG.Madness.equipment.slots,
		};
	}
}

export { EquipmentSheetMadness };
