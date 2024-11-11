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
		const statusImmunities = objectMap(
			CONFIG.Madness.statusEffects.list,
			(label, e) => `Madness.Passives.Immunity.${capitalizeFirstLetter(e)}`,
		);
		const otherPassives = Object.fromEntries(
			['armor'].map((p) => [
				p,
				`Madness.Passives.Modifier.${capitalizeFirstLetter(p)}`,
			]),
		);
		return {
			...sheetData,
			slots: CONFIG.Madness.equipment.slots,
			passives: {
				...attributesPassives,
				...magicsPassives,
				...statusImmunities,
				...otherPassives,
			},
		};
	}
}

export { EquipmentSheetMadness };
