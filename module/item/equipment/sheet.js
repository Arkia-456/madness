import { ItemSheetMadness } from '../index.js';

class EquipmentSheetMadness extends ItemSheetMadness {
	async getData(options) {
		const sheetData = await super.getData(options);
		return {
			...sheetData,
			slots: CONFIG.Madness.Equipment.Slots,
		};
	}
}

export { EquipmentSheetMadness };
