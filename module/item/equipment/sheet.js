import { capitalizeFirstLetter, objectMap } from '../../../utils/misc.js';
import { ItemSheetMadness } from '../index.js';

class EquipmentSheetMadness extends ItemSheetMadness {
	async getData(options) {
		const sheetData = await super.getData(options);
		const attributesPassives = objectMap(
			CONFIG.Madness.attributes,
			(label, attr) =>
				`Madness.Passives.Modifier.${capitalizeFirstLetter(attr)}`,
		);
		const { derion, escura, ...allowedMagics } = CONFIG.Madness.magics;
		const magicsPassives = objectMap(
			allowedMagics,
			(label, attr) =>
				`Madness.Passives.Modifier.${capitalizeFirstLetter(attr)}`,
		);
		return {
			...sheetData,
			slots: CONFIG.Madness.equipment.slots,
			passives: {
				...attributesPassives,
				...magicsPassives,
			},
		};
	}
}

export { EquipmentSheetMadness };
