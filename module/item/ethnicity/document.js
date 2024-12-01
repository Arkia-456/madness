import { ItemMadness } from '../index.js';

class EthnicityMadness extends ItemMadness {
	prepareActorData() {
		const actor = this.actor;
		actor.ethnicity = this;
		Object.entries(this.system.attributes).forEach(([key, value]) => {
			actor.system.attributes[key].ethnicity = value.value;
		});

		super.prepareActorData();
	}
}

export { EthnicityMadness };
