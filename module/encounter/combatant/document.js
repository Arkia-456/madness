class CombatantMadness extends Combatant {
	startTurn() {
		this._removeBuffsAndDebuffs(this.actor, 'start');
	}

	async _removeBuffsAndDebuffs(actor, applicationTime) {
		const durationFilter = (d) =>
			d.type === 'turn' && d.applicationTime === applicationTime;
		const effectsToRemove = actor.effects.filter((e) =>
			e.system.durations?.some(durationFilter),
		);
		if (!effectsToRemove) return;

		const [toRemove, toDecrease] = effectsToRemove.reduce(
			(arr, e) => {
				const duration = e.system.durations.find(durationFilter);
				if (duration.value > 1) {
					arr[1].push(e);
				} else {
					arr[0].push(e);
				}
				return arr;
			},
			[[], []],
		);

		if (toRemove.length) {
			await actor.toggleStatusEffects(toRemove.map((e) => e.system.slug));
		}

		if (toDecrease.length) {
			await actor.decreaseStatusEffectsDuration(
				toDecrease.map((e) => e.system.slug),
				durationFilter,
			);
		}
	}
}

export { CombatantMadness };
