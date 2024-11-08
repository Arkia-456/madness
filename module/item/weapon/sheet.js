import { SkillSheetMadness } from '../skill/index.js';

class WeaponSheetMadness extends SkillSheetMadness {
	async getData(options) {
		const sheetData = await super.getData(options);
		return {
			...sheetData,
			modules: Object.entries(CONFIG.Madness.modules).reduce(
				(modules, [key, value]) => {
					modules[key] = value.label;
					return modules;
				},
				{},
			),
		};
	}
}

export { WeaponSheetMadness };
