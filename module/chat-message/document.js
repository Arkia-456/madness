class ChatMessageMadness extends ChatMessage {
	get actor() {
		return ChatMessageMadness.getSpeakerActor(this.speaker);
	}

	get item() {
		const actor = this.actor;
		const origin = this.flags.madness?.origin ?? null;
		const match = /Item\.(\w+)/.exec(origin?.uuid ?? '') ?? [];
		const itemId = match[1] ?? '';
		return actor?.items.get(itemId) ?? null;
	}

	async getHTML() {
		const $html = await super.getHTML();
		const html = $html[0];
		this.activateClickListener(html);
		return $html;
	}

	activateClickListener(html) {
		const handlers = {};

		handlers['dodge'] = (event, actionTarget) => {
			this.dodgeFromMessage();
		};
		handlers['parry'] = (event, actionTarget) => {
			this.parryFromMessage();
		};

		const cardHandler = async (event) => {
			const element = event.target;
			const actionTarget = element.closest(
				'a[data-action], button[data-action]',
			);
			const handler = handlers[actionTarget?.dataset.action ?? ''];
			if (handler && actionTarget) {
				event.stopImmediatePropagation();
				html.removeEventListener('click', cardHandler);
				try {
					await handler(event, actionTarget);
				} catch (error) {
					console.error(error);
				} finally {
					html.addEventListener('click', cardHandler);
				}
			}
		};

		html.addEventListener('click', cardHandler);

		return handlers;
	}

	async dodgeFromMessage() {
		const tokens = game.user.getActiveTokens();
		if (!tokens.length) {
			const errorMessage = game.i18n.localize(
				'Madness.Message.Error.NoTokenSeleted',
			);
			return ui.notifications.error(errorMessage);
		}
		const token = tokens[0];
		const roll = await token.actor.dodge(token);
	}

	async parryFromMessage() {
		const tokens = game.user.getActiveTokens();
		if (!tokens.length) {
			const errorMessage = game.i18n.localize(
				'Madness.Message.Error.NoTokenSeleted',
			);
			return ui.notifications.error(errorMessage);
		}
		const token = tokens[0];
		const roll = await token.actor.parry(token);
	}
}

export { ChatMessageMadness };
