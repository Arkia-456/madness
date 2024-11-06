export class ActiveEffectMadness extends ActiveEffect {
	static async _fromStatusEffect(statusId, effectData, options) {
		effectData.system = {
			stackable: effectData.stackable,
			slug: effectData.slug,
			effects: effectData.effects,
			durations: effectData.durations,
		};
		return super._fromStatusEffect(statusId, effectData, options);
	}

	prepareActorData() {
		console.log(
			`Madness system | Actor | ${this.parent.name} | Preparing actor data...`,
		);
		const actor = this.parent;
		const stacks = this.system.stackable ? this.system.stacks : 1;
		this.system.effects
			?.filter((e) => e.name === 'increasePrimaryAttribute')
			?.forEach((e) => {
				const primaryAttributes = Object.keys(actor.system.attributes);
				console.log(primaryAttributes);
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
		console.log(
			`Madness system | Actor | ${this.parent.name} | Actor data prepared ✅`,
		);
	}
}
