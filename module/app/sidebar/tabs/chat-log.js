class ChatLogMadness extends ChatLog {
	_getEntryContextOptions() {
		const entryContextOptions = super._getEntryContextOptions();
		const revealMessageEntry = entryContextOptions.find(
			(entry) => entry.name === 'CHAT.RevealMessage',
		);
		if (revealMessageEntry) {
			revealMessageEntry.condition = () => true;
			revealMessageEntry.callback = (li) => {
				const message = game.messages.get(li.data('messageId'));
				return message.update({
					whisper: [],
					blind: false,
					'system.forceVisible': true,
				});
			};
		}
		const concealMessageEntry = entryContextOptions.find(
			(entry) => entry.name === 'CHAT.ConcealMessage',
		);
		if (concealMessageEntry) {
			concealMessageEntry.callback = (li) => {
				const message = game.messages.get(li.data('messageId'));
				return message.update({
					whisper: ChatMessage.getWhisperRecipients('gm').map((u) => u.id),
					blind: false,
					'system.forceVisible': false,
				});
			};
		}
		entryContextOptions.splice(entryContextOptions.length - 1, 0);
		return entryContextOptions;
	}
}

export { ChatLogMadness };
