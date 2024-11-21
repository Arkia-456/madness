import {
	capitalizeFirstLetter,
	displayError,
	uncapitalizeFirstLetter,
} from '../../utils/index.js';

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

	get visible() {
		const visible = super.visible;
		if (this.system.forceVisible) return true;
		if (this.whisper.length) {
			return this.isAuthor || this.whisper.includes(game.user.id);
		}
		if (game.user.isGM) return true;
		if (canvas.ready && visible) {
			const speaker = canvas.tokens.get(this.speaker.token);
			if (!speaker.isVisible) {
				return false;
			}
		}
		return visible;
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

		handlers['dodge'] = (event) => {
			this.dodgeFromMessage({ promptModifiers: event.shiftKey });
		};
		handlers['parry'] = (event) => {
			this.parryFromMessage({ promptModifiers: event.shiftKey });
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

	async dodgeFromMessage({ promptModifiers = false }) {
		const tokens = game.user.getActiveTokens();
		if (!tokens.length) {
			displayError('Madness.Message.Error.NoTokenSelected');
			return;
		}
		const token = tokens[0];
		const { canDodge: actorCanDodge, effects: actorCantDodgeEffects } =
			token.actor.dodgeEffects;
		const { canDodge: itemCanDodge, effects: itemCantDodgeEffects } =
			this.item.dodgeEffects;
		if (!actorCanDodge || !itemCanDodge) {
			const confirmDodge = await this._displayCantDodgeConfirmDialog(
				actorCantDodgeEffects,
				itemCantDodgeEffects,
			);
			if (!confirmDodge) return;
		}
		const roll = await token.actor.dodge(token, { promptModifiers });
		if (roll.isCritical || roll.result === 'success') return;
		const damage = this.applyDamageFromMessage(token);
		await this.toMessage({ type: 'dodge', actor: token.actor, damage });
		await this._removeBuffsAndDebuffs(token.actor);
	}

	async toMessage(options) {
		const { actor, type, damage } = options;
		const template = 'systems/madness/templates/chat/defense-card.hbs';
		let actionTranslation = '';
		switch (type) {
			case 'dodge':
				actionTranslation = game.i18n
					.localize('Madness.Actions.TriedToDodge')
					?.toLowerCase();
				break;
			case 'parry':
				actionTranslation = game.i18n
					.localize('Madness.Actions.ParryPast')
					?.toLowerCase();
				break;
			default:
				break;
		}
		const andTranslation = game.i18n
			.localize('Madness.Dialog.And')
			?.toLowerCase();
		const tookTranslation = game.i18n
			.localize('Madness.Actions.TakePast')
			?.toLowerCase();
		const damageTranslation = game.i18n
			.localize('Madness.Label.Damage')
			?.toLowerCase();
		const message = `${actor.name} ${actionTranslation} ${actionTranslation ? `${andTranslation} ` : ''}${tookTranslation} ${damage ?? 0} ${damageTranslation}.`;
		const templateData = {
			message,
		};
		const chatData = {
			speaker: ChatMessageMadness.getSpeaker({
				actor: actor,
				token: actor.token,
			}),
			content: await renderTemplate(template, templateData),
		};
		ChatMessageMadness.create(chatData);
	}

	async parryFromMessage({ promptModifiers = false }) {
		const tokens = game.user.getActiveTokens();
		if (!tokens.length) {
			displayError('Madness.Message.Error.NoTokenSelected');
			return;
		}
		const token = tokens[0];
		const { canParry: actorCanParry, effects: actorCantParryEffects } =
			token.actor.parryEffects;
		const { canParry: itemCanParry, effects: itemCantParryEffects } =
			this.item.parryEffects;
		if (!actorCanParry || !itemCanParry) {
			const confirmParry = await this._displayCantParryConfirmDialog(
				actorCantParryEffects,
				itemCantParryEffects,
			);
			if (!confirmParry) return;
		}
		const roll = await token.actor.parry(token, { promptModifiers });
		if (roll.isCritical) return;
		const damage = this.applyDamageFromMessage(token, {
			parry: true,
			modifiers: roll.modifiers,
		});
		await this.toMessage({ type: 'parry', actor: token.actor, damage });
		await this._removeBuffsAndDebuffs(token.actor);
	}

	_displayCantParryOrDodgeConfirmDialog(
		type,
		actorEffects = [],
		itemEffects = [],
	) {
		const cantTranslation = game.i18n.localize(
			`Madness.Dialog.Cant${capitalizeFirstLetter(type)}`,
		);
		const becauseTranslation = uncapitalizeFirstLetter(
			game.i18n.localize('Madness.Dialog.Reason.Because'),
		);
		const andTranslation = uncapitalizeFirstLetter(
			game.i18n.localize('Madness.Dialog.And'),
		);

		let actorReasonTranslation = '';
		let itemReasonTranslation = '';

		if (actorEffects.length) {
			actorReasonTranslation = uncapitalizeFirstLetter(
				game.i18n.format(
					actorEffects.length > 1
						? 'Madness.Dialog.Reason.ActorEffects'
						: 'Madness.Dialog.Reason.ActorEffect',
					{
						effects: actorEffects.map((e) => e.name).join(', '),
					},
				),
			);
		}

		if (itemEffects.length) {
			itemReasonTranslation = uncapitalizeFirstLetter(
				game.i18n.format(
					itemEffects.length > 1
						? 'Madness.Dialog.Reason.ItemEffects'
						: 'Madness.Dialog.Reason.ItemEffect',
					{
						effects: itemEffects.map((e) => e.name).join(', '),
					},
				),
			);
		}

		const reasonTranslation = `${actorReasonTranslation}${actorReasonTranslation && itemReasonTranslation ? ` ${andTranslation} ` : ''}${itemReasonTranslation}`;
		const askContinueTranslation = game.i18n.localize(
			'Madness.Dialog.AskContinue',
		);

		const content = `${cantTranslation} ${becauseTranslation} ${reasonTranslation}. ${askContinueTranslation}`;
		return this._displayConfirmDialog({ content });
	}

	_displayCantParryConfirmDialog(actorEffects, itemEffects) {
		return this._displayCantParryOrDodgeConfirmDialog(
			'parry',
			actorEffects,
			itemEffects,
		);
	}

	_displayCantDodgeConfirmDialog(actorEffects, itemEffects) {
		return this._displayCantParryOrDodgeConfirmDialog(
			'dodge',
			actorEffects,
			itemEffects,
		);
	}

	_displayConfirmDialog({ title, content }) {
		const confirmDialogTitle =
			title ?? game.i18n.localize('Madness.Dialog.Confirm');
		const confirmDialogContent = content;
		return Dialog.confirm({
			title: confirmDialogTitle,
			content: confirmDialogContent,
		});
	}

	async takeDamageFromMessage() {
		const tokens = game.user.getActiveTokens();
		if (!tokens.length) {
			displayError('Madness.Message.Error.NoTokenSelected');
			return;
		}
		const token = tokens[0];
		const damage = this.applyDamageFromMessage(token);
		await this.toMessage({ actor: token.actor, damage });
		await this._removeBuffsAndDebuffs(token.actor);
	}

	applyDamageFromMessage(token, options) {
		const context = this.flags.madness?.context ?? {};
		const outcome = context.outcome?.total ?? 0;
		const passives = context.passives;
		const effects = Object.values(context.item.system.items ?? []).reduce(
			(arr, i) => {
				const effect = CONFIG.statusEffects.find(
					(e) => e.id === i.system.statusEffect,
				);
				if (effect) arr.push(effect);
				return arr;
			},
			[],
		);
		if (!outcome && !passives.length && !effects.length) return;
		return token.actor.applyDamage(outcome, {
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
