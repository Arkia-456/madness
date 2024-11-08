import { ItemSheetMadness } from '../index.js';

class EffectSheetMadness extends ItemSheetMadness {
	async getData(options) {
		const sheetData = await super.getData(options);
		return {
			...sheetData,
			magics: CONFIG.Madness.magics,
			statusEffects: CONFIG.Madness.statusEffects.list,
		};
	}
}

export { EffectSheetMadness };
