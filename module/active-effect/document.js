export class ActiveEffectMadness extends ActiveEffect {
	static MODIFIABLE_SYSTEM_ENTRIES = ['attributes', 'secondaryAttributes'];

	/**
	 * Add some data to status effect system before creating an ActiveEffect instance
	 * @param {string} statusId the status effect ID
	 * @param {ActiveEffectData} effectData the status effect data
	 * @param {DocumentModificationContext} [options] additional options to pass to ActiveEffect instantiation
	 * @returns {Promise<ActiveEffect>}
	 */
	static async _fromStatusEffect(statusId, effectData, options) {
		effectData.system = {
			stackable: effectData.stackable,
			slug: effectData.slug,
			effects: effectData.effects,
			durations: effectData.durations,
		};
		if (effectData.slug) {
			effectData.description = game.i18n.localize(
				CONFIG.Madness.statusEffects[effectData.slug]?.description,
			);
		}
		return super._fromStatusEffect(statusId, effectData, options);
	}

	get effects() {
		return this.system.effects;
	}

	get slug() {
		return this.system.slug;
	}

	get stackable() {
		return this.system.stackable;
	}

	get stacks() {
		return this.system.stacks;
	}

	/**
	 * Prepare actor data from status effect
	 */
	prepareActorData() {
		console.log(
			`Madness system | Actor | ${this.parent.name} | ActiveEffect | ${this.slug} | Preparing actor data...`,
		);
		const actor = this.parent;
		const stacks = this.stackable ? this.stacks : 1;

		this.effects?.forEach((e) => {
			if (e.type !== 'statModifier') return;
			const value = stacks * e.value;
			if (e.target === 'primary') {
				for (const attr in actor.system.attributes) {
					actor.system.attributes[attr].effects = value;
				}
			} else {
				for (const id of ActiveEffectMadness.MODIFIABLE_SYSTEM_ENTRIES) {
					const target = actor.system[id]?.[e.target];
					if (target) {
						target.effects = value;
						break;
					}
				}
			}
		});
	}
}
