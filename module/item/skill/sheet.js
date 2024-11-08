import { ItemSheetMadness } from '../index.js';

class SkillSheetMadness extends ItemSheetMadness {
	_droppables = ['effect'];

	async getData(options) {
		const sheetData = await super.getData(options);
		return {
			...sheetData,
			attributes: CONFIG.Madness.primaryAttributes.reduce(
				(attributes, slug) => {
					const attribute = CONFIG.Madness.attributes[slug];
					if (attribute) attributes[slug] = attribute;
					return attributes;
				},
				{},
			),
		};
	}
}

export { SkillSheetMadness };
