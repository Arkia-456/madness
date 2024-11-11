import { ItemSheetMadness } from '../index.js';

class EthnicitySheetMadness extends ItemSheetMadness {
	async getData(options) {
		return {
			...(await super.getData(options)),
			statusEffects: CONFIG.Madness.statusEffects.list,
		};
	}
}

export { EthnicitySheetMadness };
