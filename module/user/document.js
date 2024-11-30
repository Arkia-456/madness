class UserMadness extends User {
	get activeToken() {
		return this.activeTokens[0];
	}

	get activeTokens() {
		if (!canvas.ready || !canvas.tokens.controlled.length) {
			return game.user.character?.getActiveTokens(true, true) ?? [];
		}
		return canvas.tokens.controlled
			.filter((t) => t.isOwner)
			.map((t) => t.document);
	}
}

export { UserMadness };
