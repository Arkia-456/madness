import { ItemSheetMadness } from '../index.js';

class EffectSheetMadness extends ItemSheetMadness {
	static get defaultOptions() {
		return {
			...super.defaultOptions,
			hasDetails: true,
		};
	}

	async getData(options) {
		const sheetData = await super.getData(options);
		return {
			...sheetData,
			magics: Object.entries(CONFIG.Madness.magics).reduce(
				(magics, [id, m]) => {
					magics[id] = m.label;
					return magics;
				},
				{},
			),
			statusEffects: CONFIG.Madness.statusEffects.list,
		};
	}
}

export { EffectSheetMadness };
