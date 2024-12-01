import {
	capitalizeFirstLetter,
	displayError,
	elide,
	uncapitalizeFirstLetter,
} from '../../utils/index.js';
import { ItemProxyMadness } from '../item/document.js';

class ChatMessageMadness extends ChatMessage {
	get actor() {
		return ChatMessageMadness.getSpeakerActor(this.speaker);
	}

	get item() {
		const actor = this.actor;
		const origin = this.flags.madness?.origin ?? null;
		const match = /Item\.(\w+)/.exec(origin?.uuid ?? '') ?? [];
		const itemId = match[1] ?? '';
		return (
			actor?.items.get(itemId) ??
			new ItemProxyMadness(this.flags.madness?.context?.item) ??
			null
		);
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

	/* ------------------------------- */
	/*  Event listeners                */
	/* ------------------------------- */

	activateClickListener(html) {
		const handlers = {};

		handlers['take-damage'] = () => {
			this._onClickApplyDamage();
		};

		handlers['dodge'] = (event) => {
			this._onClickDodge({ promptModifiers: event.shiftKey });
		};
		handlers['parry'] = (event) => {
			this._onClickParry({ promptModifiers: event.shiftKey });
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

	/* ------------------------------- */
	/*  Click handlers                 */
	/* ------------------------------- */

	async _onClickDodge({ promptModifiers = false }) {
		const token = game.user.activeToken;
		if (!token) {
			displayError('Madness.Message.Error.NoTokenSelected');
			return;
		}

		const { canDodge, effects } = this._checkCanDodge(token);
		if (!canDodge && !(await this._confirmDodge(effects))) {
			return;
		}

		const roll = await token.actor.dodge({ promptModifiers });

		let damage;
		if (!roll.isCritical && roll.result !== 'success') {
			damage = this._applyDamageFromMessage(token);
		}
		await this.toMessage({ type: 'dodge', actor: token.actor, damage, roll });
		await this._decreaseBuffsAndDebuffs(token.actor);
	}

	/**
	 * Check if the attack is dodgeable
	 * @param {TokenMadness} token the token trying to dodge
	 * @returns {{canDodge: boolean, effects: Array<Array<ActiveEffectMadness|EffectMadness>>}} boolean to indicate if attack is dodgeable and array of effects preventing dodge
	 */
	_checkCanDodge(token) {
		const { canDodge: actorCanDodge, effects: actorCantDodgeEffects } =
			token.actor.dodgeEffects;
		const { canDodge: itemCanDodge, effects: itemCantDodgeEffects } =
			this.item.dodgeEffects;
		return {
			canDodge: actorCanDodge && itemCanDodge,
			effects: [actorCantDodgeEffects, itemCantDodgeEffects],
		};
	}

	/**
	 * Display confirm dialog to ask user if he wants to dodge anyway
	 * @param {Array<Array<ActiveEffectMadness|EffectMadness>>} effects effects preventing dodge
	 * @returns `true` if user confirm dodge, `false` otherwise
	 */
	_confirmDodge([actorCantDodgeEffects, itemCantDodgeEffects]) {
		return this._displayCantParryOrDodgeConfirmDialog(
			'dodge',
			actorCantDodgeEffects,
			itemCantDodgeEffects,
		);
	}

	async _onClickParry({ promptModifiers = false }) {
		const token = game.user.activeToken;
		if (!token) {
			displayError('Madness.Message.Error.NoTokenSelected');
			return;
		}

		const { canParry, effects } = this._checkCanParry(token);
		if (!canParry && !(await this._confirmParry(effects))) {
			return;
		}

		const roll = await token.actor.parry({ promptModifiers });

		let damage;
		if (!roll.isCritical) {
			damage = this._applyDamageFromMessage(token, {
				parry: true,
				modifiers: roll.modifiers,
			});
		}
		await this.toMessage({ type: 'parry', actor: token.actor, damage, roll });
		await this._decreaseBuffsAndDebuffs(token.actor);
	}

	/**
	 * Check if the attack is parryable
	 * @param {TokenMadness} token the token trying to parry
	 * @returns {{canDodge: boolean, effects: Array<Array<ActiveEffectMadness|EffectMadness>>}} boolean to indicate if attack is parryable and array of effects preventing parry
	 */
	_checkCanParry(token) {
		const { canParry: actorCanParry, effects: actorCantParryEffects } =
			token.actor.parryEffects;
		const { canParry: itemCanParry, effects: itemCantParryEffects } =
			this.item.parryEffects;
		return {
			canParry: actorCanParry && itemCanParry,
			effects: [actorCantParryEffects, itemCantParryEffects],
		};
	}

	/**
	 * Display confirm dialog to ask user if he wants to parry anyway
	 * @param {Array<Array<ActiveEffectMadness|EffectMadness>>} effects effects preventing parry
	 * @returns `true` if user confirm parry, `false` otherwise
	 */
	_confirmParry([actorCantParryEffects, itemCantParryEffects]) {
		return this._displayCantParryOrDodgeConfirmDialog(
			'parry',
			actorCantParryEffects,
			itemCantParryEffects,
		);
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

	_displayConfirmDialog({ title, content }) {
		const confirmDialogTitle =
			title ?? game.i18n.localize('Madness.Dialog.Confirm');
		const confirmDialogContent = content;
		return Dialog.confirm({
			title: confirmDialogTitle,
			content: confirmDialogContent,
		});
	}

	async _onClickApplyDamage() {
		const token = game.user.activeToken;
		if (!token) {
			displayError('Madness.Message.Error.NoTokenSelected');
			return;
		}
		const damage = this._applyDamageFromMessage(token);
		await this.toMessage({ actor: token.actor, damage });
		await this._decreaseBuffsAndDebuffs(token.actor);
	}

	/**
	 * Apply damage to actor based on message data
	 * @param {TokenMadness} token token to which apply damage
	 * @param {object} options options which modify damage application
	 * @returns {number|undefined} total damage applied or `undefined` if actor has no HP
	 */
	_applyDamageFromMessage(token, options) {
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

	/**
	 * Create a new chat message based on user action
	 * @param {object} options message options
	 */
	async toMessage(options) {
		const { actor, type, damage, roll } = options;
		const template = 'systems/madness/templates/chat/defense-card.hbs';
		let actionTranslation = '';
		let resultMessage = '';
		switch (type) {
			case 'dodge': {
				actionTranslation = game.i18n
					.localize('Madness.Actions.TryToDodge')
					?.toLowerCase();
				const dodgeLabel = game.i18n.localize('Madness.Label.Dodge');
				resultMessage = `${elide(game.i18n.localize('Madness.ChatMessage.CheckOf'), dodgeLabel)}${dodgeLabel.toLowerCase()}`;
				break;
			}
			case 'parry': {
				actionTranslation = game.i18n
					.localize('Madness.Actions.Parry')
					?.toLowerCase();
				const criticalLabel = game.i18n.localize('Madness.Label.Critical');
				resultMessage = `${elide(game.i18n.localize('Madness.ChatMessage.CheckOf'), criticalLabel)}${criticalLabel.toLowerCase()}`;
				break;
			}
			default:
				break;
		}
		const takeTranslation = game.i18n
			.localize('Madness.Actions.Take')
			?.toLowerCase();
		const damageTranslation = game.i18n
			.localize(`Madness.Label.Damage${(damage ?? 0) > 1 ? 'Plural' : ''}`)
			?.toLowerCase();
		const actionMessage = actionTranslation
			? `${actor.name} ${actionTranslation}.`
			: '';
		const message = `${actor.name} ${takeTranslation} ${damage ?? 0} ${damageTranslation}.`;
		const templateData = {
			type,
			roll,
			actionMessage,
			resultMessage,
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

	/**
	 * Decrease actor active effects after receiving attack
	 * @param {ActorMadness} actor actor from which remove buffs and debuffs
	 * @returns {Promise<Array<ActiveEffectMadness|boolean|undefined>>} array of updated `ActiveEffectMadness` document instances, `boolean`s and/or `undefined`s
	 */
	_decreaseBuffsAndDebuffs(actor) {
		const durationFilter = (d) =>
			d.type === 'action' && d.actionOrigin === 'other';
		const effectsToRemove = actor.effects.filter((e) =>
			e.system.durations?.some(durationFilter),
		);
		if (!effectsToRemove) return;

		return actor.decreaseStatusEffectsDuration(
			effectsToRemove.map((e) => e.system.slug),
			durationFilter,
		);
	}
}

export { ChatMessageMadness };
