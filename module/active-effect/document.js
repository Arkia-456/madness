export class ActiveEffectMadness extends ActiveEffect {
	static async _fromStatusEffect(statusId, effectData, options) {
		effectData.system = {
			stackable: effectData.stackable,
			slug: effectData.slug,
			effects: effectData.effects,
		};
		return super._fromStatusEffect(statusId, effectData, options);
	}
}
