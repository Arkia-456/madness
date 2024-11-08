import { SkillSheetMadness } from '../skill/index.js';

class WeaponSheetMadness extends SkillSheetMadness {
	async getData(options) {
		const sheetData = await super.getData(options);
		return {
			...sheetData,
			modules: CONFIG.Madness.modules,
		};
	}
}

export { WeaponSheetMadness };
