import { SkillSheetMadness } from '../skill/index.js';

class SpellSheetMadness extends SkillSheetMadness {
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
		};
	}
}

export { SpellSheetMadness };
