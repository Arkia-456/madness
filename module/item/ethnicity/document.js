import { ItemMadness } from '../index.js';

class EthnicityMadness extends ItemMadness {
	prepareActorData() {
		console.log(
			`Madness system | Actor | ${this.actor.name} | Ethnicity | Preparing actor data...`,
		);
		const actor = this.actor;
		actor.ethnicity = this;
		Object.entries(this.system.attributes).forEach(([key, value]) => {
			actor.system.attributes[key].ethnicity = value.value;
		});

		actor.system.armor.ethnicity = this.system.armor;

		if (this.system.immunity) {
			actor.system.immunities.push(this.system.immunity);
		}

		console.log(
			`Madness system | Actor | ${this.actor.name} | Ethnicity | Actor data prepared ✅`,
		);
	}
}

export { EthnicityMadness };
