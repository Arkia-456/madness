import { ItemMadness } from '../index.js';

class EthnicityMadness extends ItemMadness {
	prepareActorData() {
		console.log(
			`Madness system | Actor | ${this.actor.name} | Preparing actor data...`,
		);
		const actor = this.actor;
		actor.ethnicity = this;
		Object.entries(this.system.attributes).forEach(([key, value]) => {
			actor.system.attributes[key].ethnicity = value.value;
		});

		actor.system.armor.ethnicity = this.system.armor;
		console.log(
			`Madness system | Actor | ${this.actor.name} | Actor data prepared ✅`,
		);
	}
}

export { EthnicityMadness };
