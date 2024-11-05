export class ActiveEffectMadness extends ActiveEffect {
	static async _fromStatusEffect(statusId, effectData, options) {
		effectData.system = {
			stackable: effectData.stackable,
			slug: effectData.slug,
		};
		return super._fromStatusEffect(statusId, effectData, options);
	}
}
