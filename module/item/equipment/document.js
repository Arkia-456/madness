import { ItemMadness } from '../index.js';

class EquipmentMadness extends ItemMadness {
	prepareActorData() {
		console.log(
			`Madness system | Actor | ${this.actor.name} | Equipment | ${this.name} | Preparing actor data...`,
		);
		const actor = this.actor;

		const primaryAttributes = Object.keys(actor.system.attributes);
		const secondaryAttributes = Object.keys(CONFIG.Madness.formulas.attributes);
		const magics = Object.keys(actor.system.magics);
		const secondaryMagics = Object.keys(CONFIG.Madness.formulas.magics);
		const statusEffects = Object.keys(CONFIG.Madness.statusEffects.list);

		Object.values(this.system.passives).forEach((p) => {
			if (!p.active) return;

			// Primary attributes modifiers
			if (primaryAttributes.includes(p.passive)) {
				actor.system.attributes[p.passive].passives =
					(actor.system.attributes[p.passive].passives ?? 0) + p.strength;
				return;
			}

			// Secondary attributes modifiers
			if (secondaryAttributes.includes(p.passive)) {
				actor.system.secondaryAttributes[p.passive].passives =
					(actor.system.secondaryAttributes[p.passive].passives ?? 0) +
					p.strength;
				return;
			}

			// Magics modifiers
			if (magics.includes(p.passive)) {
				actor.system.magics[p.passive].passives =
					(actor.system.magics[p.passive].passives ?? 0) + p.strength;
				return;
			}

			// Secondary magics modifiers
			if (secondaryMagics.includes(p.passive)) {
				actor.system.secondaryMagics[p.passive].passives =
					(actor.system.secondaryMagics[p.passive].passives ?? 0) + p.strength;
				return;
			}

			// HP/MP/armor modifiers
			if (p.passive === 'hp' || p.passive === 'mp' || p.passive === 'armor') {
				actor.system[p.passive].passives =
					(actor.system[p.passive].passives ?? 0) + p.strength;
				return;
			}

			if (statusEffects.includes(p.passive)) {
				actor.system.immunities.push(p.passive);
				return;
			}
		});

		console.log(
			`Madness system | Actor | ${this.actor.name} | Equipment | ${this.name} | Actor data prepared ✅`,
		);
	}
}

export { EquipmentMadness };
