import { objectMap } from '../../../utils/index.js';
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
			attributesLabels: CONFIG.Madness.attributes,
			statusEffects: objectMap(
				CONFIG.Madness.statusEffects,
				(statusEffect) => statusEffect.name,
			),
		};
	}
}

export { EthnicitySheetMadness };
