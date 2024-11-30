import { NaNError } from '../../utils/index.js';

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

	get durations() {
		return this.system.durations;
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
		return this.system.stacks ?? 0;
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

		console.log(
			`Madness system | Actor | ${this.parent.name} | ActiveEffect | ${this.slug} | Actor data prepared ✅`,
		);
	}

	/**
	 * Decrease duration selected with filter callback
	 * @param {Function} filter callback to filter which duration to decrease
	 * @returns {Promise<ActiveEffectMadness>} updated document instance
	 */
	decreaseDuration(filter) {
		const durations = foundry.utils.deepClone(this.durations);
		const duration = durations.find(filter);
		if (!duration) {
			throw new Error(`Duration not found on ${this.name}: ${filter}`);
		}
		const durationIndex = this.durations.findIndex(filter);
		const newValue = Math.max(0, duration.value - 1);
		durations[durationIndex].value = newValue;
		return this.update({ ['system.durations']: durations });
	}

	/**
	 * Remove a certain number of stacks
	 * @param {number} value number of stacks to remove
	 * @returns {Promise<ActiveEffectMadness>} updated document instance
	 */
	decreaseStacks(value = 1) {
		if (isNaN(value)) throw new NaNError(value);
		return this.updateStacks(Math.max(0, this.stacks - value));
	}

	/**
	 * Add a certain number of stacks
	 * @param {number} value number of stacks to add
	 * @returns {Promise<ActiveEffectMadness>} updated document instance
	 */
	increaseStacks(value = 1) {
		if (isNaN(value)) throw new NaNError(value);
		return this.updateStacks(this.stacks + value);
	}

	/**
	 * Update stacks value
	 * @param {number} value new stacks value
	 * @returns {Promise<ActiveEffectMadness>} updated document instance
	 */
	updateStacks(value) {
		return this.update({ 'system.stacks': value });
	}
}
