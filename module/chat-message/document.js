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
}

export { ChatMessageMadness };
