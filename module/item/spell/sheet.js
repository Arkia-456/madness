import { SkillSheetMadness } from '../skill/index.js';

class SpellSheetMadness extends SkillSheetMadness {
	async getData(options) {
		const sheetData = await super.getData(options);
		return {
			...sheetData,
			magics: CONFIG.Madness.Magics,
		};
	}
}

export { SpellSheetMadness };
