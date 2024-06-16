import { Formula, fontAwesomeIcon } from '../../utils/index.js';
import { EditAttributesPopup } from './popups/edit-attributes-popup.js';
import { EditMagicsPopup } from './popups/edit-magics-popup.js';

class ActorSheetMadness extends ActorSheet {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.classes = ['madness', 'sheet'];
		options.width = 750;
		options.height = 750;
		options.tabs = [
			{
				navSelector: 'nav.sheet-navigation',
				contentSelector: '.sheet-content',
				initial: 'character',
			},
		];
		return options;
	}

	get template() {
		return 'systems/madness/templates/actor/sheet.hbs';
	}

	async getData(options) {
		const sheetData = await super.getData(options);
		const actor = this.actor;
		sheetData.system = actor.system;
		sheetData.ethnicity = actor.ethnicity;
		sheetData.spells = actor.items.filter((i) => i.type === 'spell');

		return sheetData;
	}

	async _onDropItem(event, data) {
		event.preventDefault();
		const item = await Item.fromDropData(data);
		if (!item) return [];
		return this._handleDroppedItem(event, item);
	}

	async _handleDroppedItem(event, item) {
		const itemSource = item.toObject();
		const tab = event.target.closest('.tab')?.dataset?.tab;
		const allowDrop =
			(itemSource.type === 'ethnicity' && tab === 'character') ||
			(itemSource.type === 'spell' && tab === 'actions');
		if (allowDrop) {
			return this._onDropItemCreate(
				new Item.implementation(itemSource).clone().toObject(),
			);
		}
	}

	activateListeners($html) {
		super.activateListeners($html);

		const html = $html[0];

		const actor = this.actor;
		const system = actor.system;
		this._generateAttributesTooltip(html, system.attributes);
		this._generateSpellsTooltip(
			html,
			actor.items.filter((i) => i.type === 'spell'),
		);

		const characterTab = html.querySelector('.tab[data-tab=character]');
		if (characterTab && this.isEditable) {
			const contextMenuEntryEdit = {
				name: 'Madness.Controls.Edit',
				icon: fontAwesomeIcon('edit'),
				callback: ($target) => {
					const itemId = $target[0].closest('[data-item-id]')?.dataset.itemId;
					const item = actor.items.get(itemId);
					item.sheet.render(true, { focus: true });
				},
			};

			const contextMenuEntryDelete = {
				name: 'Madness.Controls.Delete',
				icon: fontAwesomeIcon('trash'),
				callback: ($target) => {
					const itemId = $target[0].closest('[data-item-id]')?.dataset.itemId;
					const item = actor.items.get(itemId);
					item.delete();
				},
			};

			new ContextMenu(
				characterTab,
				'.detail-item-control',
				[contextMenuEntryEdit, contextMenuEntryDelete],
				{
					eventName: 'click',
					onOpen: () => {
						const menu = document.getElementById('context-menu');
						if (menu) {
							const leftPlacement = 1 * Math.floor(0.95 * menu.clientWidth);
							menu.style.right = `${leftPlacement}px`;
						}
					},
				},
			);
		}

		this.activateClickListener(html);
	}

	activateClickListener(html) {
		const handlers = {};

		handlers['edit-attributes'] = () => {
			return new EditAttributesPopup(this.actor).render(true);
		};

		handlers['edit-magics'] = () => {
			return new EditMagicsPopup(this.actor).render(true);
		};

		handlers['open-compendium'] = (_, actionTarget) => {
			return game.packs
				.get(actionTarget.dataset.compendium ?? '')
				?.render(true);
		};

		handlers['roll-check'] = (event, anchor) => {
			let attrId = anchor.closest('[data-attribute]')?.dataset.attribute;
			if (attrId) {
				const attr = this.actor.getAttribute(attrId);
				return attr.roll();
			} else {
				attrId = anchor.closest('[data-secondary-attribute]')?.dataset
					.secondaryAttribute;
				const attr = this.actor.getSecondaryAttribute(attrId);
				const rollFormula = CONFIG.Madness.Formulas.Rolls[attrId];
				return attr.roll(rollFormula);
			}
		};

		const sheetHandler = async (event) => {
			const element = event.target;
			const actionTarget = element.closest(
				'a[data-action], button[data-action]',
			);
			const handler = handlers[actionTarget?.dataset.action ?? ''];
			if (handler && actionTarget) {
				event.stopImmediatePropagation();
				// Temporarily remove the listener to ignore unintentional double clicks
				html.removeEventListener('click', sheetHandler);
				try {
					await handler(event, actionTarget);
				} catch (error) {
					console.error(error);
				} finally {
					html.addEventListener('click', sheetHandler);
				}
			}
		};

		html.addEventListener('click', sheetHandler);

		return handlers;
	}

	_generateAttributesTooltip(html, attributes) {
		Object.entries(attributes).forEach(([key, value]) => {
			const tooltip = this._generateAttributeTooltip(value).join('<br />');
			this._addTooltip(html, `.attribute[data-id=${key}]`, tooltip);
		});
	}

	_generateAttributeTooltip(value) {
		const naturalStr = `${game.i18n.localize('Madness.Label.Character')} : ${value.value >= 0 ? '+' : ''}${value.value}`;
		const modifiersStr = value._modifiers.reduce((str, modifier) => {
			if (str.length) str += '<br />';
			return (str += `${game.i18n.localize(`Madness.${modifier.sourceType}`)} : ${modifier.modifier >= 0 ? '+' : ''}${modifier.modifier}`);
		}, '');
		return [naturalStr, modifiersStr];
	}

	_addTooltip(html, querySelector, tooltip) {
		html.querySelector(querySelector).dataset.tooltip = tooltip;
	}

	async _generateSpellsTooltip(html, spells) {
		for (const spell of spells) {
			const tooltip = await this._generateSpellTooltip(spell);
			this._addTooltip(html, `.spell[data-id='${spell.id}']`, tooltip);
		}
	}

	_generateSpellTooltip(spell) {
		const spellData = {
			damageFormula: Formula.generateFormulaStr(spell.system.damage),
			system: spell.system,
			effects: spell.system.items,
			criticalFailureScore: CONFIG.Madness.Default.CriticalFailureRate,
			criticalSuccessScore:
				100 - this.actor.system.secondaryAttributes.critRate.total,
		};
		return renderTemplate(
			'systems/madness/templates/actor/tooltips/spell.hbs',
			spellData,
		);
	}
}

export { ActorSheetMadness };
