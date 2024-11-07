import { uncapitalizeFirstLetter } from '../../utils/index.js';

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

		handlers['take-damage'] = () => {
			this.takeDamageFromMessage();
		};

		handlers['dodge'] = () => {
			this.dodgeFromMessage();
		};
		handlers['parry'] = () => {
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
				'Madness.Message.Error.NoTokenSelected',
			);
			return ui.notifications.error(errorMessage);
		}
		const token = tokens[0];
		const cantDodgeEffects = token.actor.effects.filter((actorEffect) =>
			actorEffect.system.effects?.some((e) => e.name === 'preventDodge'),
		);
		if (cantDodgeEffects.length) {
			const confirmDialogTitle = game.i18n.localize('Madness.Dialog.Confirm');
			const cantDodgeTranslation = game.i18n.localize(
				'Madness.Dialog.CantDodge',
			);
			const becauseTranslation = uncapitalizeFirstLetter(
				game.i18n.localize('Madness.Dialog.Reason.Because'),
			);
			const reasonTranslation = uncapitalizeFirstLetter(
				game.i18n.format(
					cantDodgeEffects.length > 1
						? 'Madness.Dialog.Reason.Effects'
						: 'Madness.Dialog.Reason.Effect',
					{
						effects: cantDodgeEffects.map((e) => e.name).join(', '),
					},
				),
			);
			const askContinueTranslation = game.i18n.localize(
				'Madness.Dialog.AskContinue',
			);
			const confirmDodge = await Dialog.confirm({
				title: confirmDialogTitle,
				content: `${cantDodgeTranslation} ${becauseTranslation} ${reasonTranslation}. ${askContinueTranslation}`,
			});
			if (!confirmDodge) return;
		}
		const roll = await token.actor.dodge(token);
		if (roll.isCritical || roll.result === 'success') return;
		this.applyDamageFromMessage(token);
		await this._removeBuffsAndDebuffs(token.actor);
	}

	async parryFromMessage() {
		const tokens = game.user.getActiveTokens();
		if (!tokens.length) {
			const errorMessage = game.i18n.localize(
				'Madness.Message.Error.NoTokenSelected',
			);
			return ui.notifications.error(errorMessage);
		}
		const token = tokens[0];
		const cantParryEffects = token.actor.effects.filter((actorEffect) =>
			actorEffect.system.effects?.some((e) => e.name === 'preventParry'),
		);
		if (cantParryEffects.length) {
			const confirmDialogTitle = game.i18n.localize('Madness.Dialog.Confirm');
			const cantParryTranslation = game.i18n.localize(
				'Madness.Dialog.CantParry',
			);
			const becauseTranslation = uncapitalizeFirstLetter(
				game.i18n.localize('Madness.Dialog.Reason.Because'),
			);
			const reasonTranslation = uncapitalizeFirstLetter(
				game.i18n.format(
					cantParryEffects.length > 1
						? 'Madness.Dialog.Reason.Effects'
						: 'Madness.Dialog.Reason.Effect',
					{
						effects: cantParryEffects.map((e) => e.name).join(', '),
					},
				),
			);
			const askContinueTranslation = game.i18n.localize(
				'Madness.Dialog.AskContinue',
			);
			const confirmParry = await Dialog.confirm({
				title: confirmDialogTitle,
				content: `${cantParryTranslation} ${becauseTranslation} ${reasonTranslation}. ${askContinueTranslation}`,
			});
			if (!confirmParry) return;
		}
		const roll = await token.actor.parry(token);
		if (roll.isCritical) return;
		this.applyDamageFromMessage(token, { parry: true });
		await this._removeBuffsAndDebuffs(token.actor);
	}

	async takeDamageFromMessage() {
		const tokens = game.user.getActiveTokens();
		if (!tokens.length) {
			const errorMessage = game.i18n.localize(
				'Madness.Message.Error.NoTokenSelected',
			);
			return ui.notifications.error(errorMessage);
		}
		const token = tokens[0];
		this.applyDamageFromMessage(token);
		await this._removeBuffsAndDebuffs(token.actor);
	}

	applyDamageFromMessage(token, options) {
		const context = this.flags.madness?.context ?? {};
		const outcome = context.outcome?.total ?? 0;
		const passives = context.passives;
		const effects = Object.values(context.item.system.items).reduce(
			(arr, i) => {
				const effect = CONFIG.statusEffects.find(
					(e) => e.id === i.system.statusEffect,
				);
				if (effect) arr.push(effect);
				return arr;
			},
			[],
		);
		if (!outcome && !passives.length) return;
		token.actor.applyDamage(outcome, {
			...options,
			passives: [...context.passives, ...effects],
		});
	}

	async _removeBuffsAndDebuffs(actor) {
		const durationFilter = (d) =>
			d.type === 'action' && d.actionOrigin === 'other';
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

export { ChatMessageMadness };
