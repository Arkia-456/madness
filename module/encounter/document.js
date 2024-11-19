class EncounterMadness extends Combat {
	_onUpdate(changed, options, userId) {
		super._onUpdate(changed, options, userId);

		const { combatant, previous } = this;
		const newTurn = changed.turn;
		const isTurnChange =
			typeof newTurn === 'number' &&
			(previous.turn === null || newTurn > previous.turn);
		const newRound = changed.round;
		const isRoundChange =
			typeof newRound === 'number' &&
			(previous.round === null || newRound > previous.round);

		if (!isTurnChange && !isRoundChange) return;

		const previousCombatant = this.combatants.get(previous.combatantId);
		if (game.user === previousCombatant?.actor.firstUpdater) {
			previousCombatant.endTurn();
		}

		if (game.user === combatant.actor.firstUpdater) {
			combatant.startTurn();
		}
	}

	async rollInitiative(ids, options = {}) {
		const messageOptions = {
			rollMode: 'gmroll',
		};
		const merged = foundry.utils.mergeObject(options, { messageOptions });
		return super.rollInitiative(ids, merged);
	}
}

export { EncounterMadness };
