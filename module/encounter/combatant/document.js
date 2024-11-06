class CombatantMadness extends Combatant {
	endTurn() {
		this._applyDoT(this.actor, 'end');
	}

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

	_applyDoT(actor, applicationTime) {
		const filter = (e) =>
			e.name === 'dot' &&
			e.applicationType === 'turn' &&
			e.applicationTime === applicationTime;
		const dotEffects = actor.effects.reduce((arr, actorEffect) => {
			const effect = foundry.utils.deepClone(actorEffect);
			const effects = effect.system.effects?.filter(filter);
			if (!effects) return arr;
			effects.forEach((e) => {
				if (effect.system.stacks) {
					e.value *= effect.system.stacks;
				}
			});
			arr.push(...effects);
			return arr;
		}, []);
		const [bypassTempHPDamage, damage] = dotEffects.reduce(
			(arr, e) => {
				if (e.bypassTempHP) {
					arr[0] += e.value;
				} else {
					arr[1] += e.value;
				}
				return arr;
			},
			[[], []],
		);
		actor.applyDamage(damage);
		actor.applyDamage(bypassTempHPDamage, {
			passives: [{ name: 'bypassTempHP' }],
		});
	}
}

export { CombatantMadness };
