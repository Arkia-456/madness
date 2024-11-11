class EffectsTrackerMadness extends Application {
	get token() {
		return canvas.tokens.controlled[0]?.document;
	}

	get actor() {
		return this.token?.actor ?? game.user?.character;
	}

	static get defaultOptions() {
		return {
			...super.defaultOptions,
			id: 'madness-effects-tracker',
			popOut: false,
			template: 'systems/madness/templates/app/effects-tracker.hbs',
		};
	}

	async getData(options) {
		if (!this.actor) {
			return {
				effects: [],
			};
		}

		const effects = this.actor.effects;

		return {
			...(await super.getData(options)),
			effects,
		};
	}

	refresh = foundry.utils.debounce(this.render, 100);
}

export { EffectsTrackerMadness };
