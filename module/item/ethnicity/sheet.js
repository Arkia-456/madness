import { ItemSheetMadness } from '../index.js';

class EthnicitySheetMadness extends ItemSheetMadness {
	static get defaultOptions() {
		return {
			...super.defaultOptions,
			hasDetails: true,
		};
	}

	async getData(options) {
		return {
			...(await super.getData(options)),
			statusEffects: CONFIG.Madness.statusEffects.list,
		};
	}
}

export { EthnicitySheetMadness };
