import { fontAwesomeIcon } from '../../utils/index.js';

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
		return this._onDropItemCreate(
			new Item.implementation(itemSource).clone().toObject(),
		);
	}

	activateListeners($html) {
		super.activateListeners($html);

		const actor = this.actor;
		const system = actor.system;
		Object.entries(system.attributes).forEach(([key, value]) => {
			const attributeContainer = $html[0].querySelector(
				`.attribute[data-id=${key}]`,
			);
			const tooltip = value._modifiers.reduce((str, modifier) => {
				if (str.length) {
					str += '<br />';
				}
				return (str += `${game.i18n.localize(`Madness.${modifier.sourceType}`)} : ${modifier.modifier >= 0 ? '+' : '-'}${Math.abs(modifier.modifier)}`);
			}, '');
			attributeContainer.dataset.tooltip = tooltip;
		});

		const characterTab = $html[0].querySelector('.tab[data-tab=character]');
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

		this.activateClickListener($html[0]);
	}

	activateClickListener(html) {
		const handlers = {};

		handlers['open-compendium'] = (_, actionTarget) => {
			return game.packs
				.get(actionTarget.dataset.compendium ?? '')
				?.render(true);
		};

		const sheetHandler = async (event) => {
			const element = event.target;
			const actionTarget = element.closest('a[data-action]');
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
}

export { ActorSheetMadness };
