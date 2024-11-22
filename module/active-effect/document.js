export class ActiveEffectMadness extends ActiveEffect {
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

	prepareActorData() {
		console.log(
			`Madness system | Actor | ${this.parent.name} | ActiveEffect | ${this.name} | Preparing actor data...`,
		);
		const actor = this.parent;
		const stacks = this.system.stackable ? this.system.stacks : 1;
		this.system.effects
			?.filter((e) => e.name === 'increasePrimaryAttribute')
			?.forEach((e) => {
				const primaryAttributes = Object.keys(actor.system.attributes);
				if (!e.attributes) {
					primaryAttributes.forEach(
						(attribute) =>
							(actor.system.attributes[attribute].effects = stacks * e.value),
					);
				} else {
					e.attributes.forEach(
						(attribute) =>
							(actor.system.attributes[attribute].effects = stacks * e.value),
					);
				}
			});
		this.system.effects
			?.filter((e) => e.name === 'increaseMaxMoveDistance')
			?.forEach((e) => {
				actor.system.secondaryAttributes.maxMoveDistance.effects =
					stacks * e.value;
			});
		console.log(
			`Madness system | Actor | ${this.parent.name} ActiveEffect | ${this.name} | Actor data prepared ✅`,
		);
	}
}
