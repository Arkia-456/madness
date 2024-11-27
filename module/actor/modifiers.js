import { createHTMLElement, elide } from '../../utils/index.js';
import { ChatMessageMadness } from '../chat-message/index.js';
import Tooltip from '../system/tooltip.js';

export class ModifierMadness {
	constructor(...args) {
		const params = {
			label: args[0],
			sourceType: args[1],
			modifier: args[2],
		};
		this.label = game.i18n.localize(params.label);
		this.sourceType = game.i18n.localize(params.sourceType);
		this.modifier = params.modifier;
	}
}

export class Attribute {
	constructor(actor, data) {
		this.actorId = actor.id;
		this.id = data.label;
		const configData = CONFIG.Madness[data.type ?? 'attributes'][data.label];
		const label = data.type === 'magics' ? configData.label : configData;
		this.label = game.i18n.localize(label);
		const seen = data.modifiers.reduce((result, modifier) => {
			const existing = result[modifier.label];
			if (
				!existing ||
				Math.abs(modifier.modifier) > Math.abs(result[modifier.label].modifier)
			) {
				result[modifier.label] = modifier;
			}
			return result;
		}, {});
		this._modifiers = Object.values(seen);
		this.calculateTotal();
	}

	get actor() {
		return game.actors.get(this.actorId);
	}

	calculateTotal() {
		this.totalModifier = this._modifiers.reduce(
			(total, m) => total + m.modifier,
			0,
		);
	}

	async roll(rollFormula = '1d@value') {
		const rollData = { value: this.total };
		const roll = await new Roll(rollFormula, rollData).roll();
		const token = this.actor.getActiveTokens(true, true)[0];
		const speaker = ChatMessageMadness.getSpeaker({
			actor: this.actor,
			token: token,
		});
		const title = `${elide(game.i18n.localize('Madness.ChatMessage.CheckOf'), this.label)}${this.label.toLowerCase()}`;
		const flavor = createHTMLElement('h4', [title]).outerHTML;
		return roll.toMessage({ speaker, flavor });
	}
}
