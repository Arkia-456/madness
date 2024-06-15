import { ItemMadness } from '../index.js';

class EthnicityMadness extends ItemMadness {
	prepareActorData() {
		console.log('Madness system | Actor | Preparing actor data...');
		const actor = this.actor;
		actor.ethnicity = this;
		Object.entries(this.system.attributes).forEach(([key, value]) => {
			actor.system.attributes[key].ethnicity = value.value;
		});
		console.log('Madness system | Actor | Actor data prepared ✅');
	}
}

export { EthnicityMadness };
