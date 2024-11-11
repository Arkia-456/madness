class TokenMadness extends Token {
	_onControl(options) {
		game.madness.effectsTracker.refresh();
		return super._onControl(options);
	}

	_onRelease(options) {
		game.madness.effectsTracker.refresh();
		return super._onRelease(options);
	}
}

export { TokenMadness };
