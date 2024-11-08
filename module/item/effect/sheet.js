import { ItemSheetMadness } from '../index.js';

class EffectSheetMadness extends ItemSheetMadness {
	async getData(options) {
		const sheetData = await super.getData(options);
		return {
			...sheetData,
			magics: CONFIG.Madness.Magics,
			statusEffects: CONFIG.Madness.StatusEffects.List,
		};
	}
}

export { EffectSheetMadness };
