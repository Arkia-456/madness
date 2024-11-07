import { fontAwesomeIcon } from '../../utils/index.js';

class ItemSheetMadness extends ItemSheet {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.classes.push('madness', 'item');
		options.width = 464;
		options.height = 520;
		options.template = 'systems/madness/templates/item/sheet.hbs';
		options.dragDrop = [{ dropSelector: '.sheet-content' }];
		return options;
	}

	async getData(options) {
		const sheetData = super.getData(options);
		const item = this.item;
		const system = item.system;
		sheetData.system = system;

		// Enriched content
		const enrichedContent = {};
		enrichedContent.description = await TextEditor.enrichHTML(
			item._source.system.description,
		);
		sheetData.enrichedContent = enrichedContent;

		return sheetData;
	}

	async _onDrop(event) {
		const data = TextEditor.getDragEventData(event);
		if (!game.user.isGM) return;
		return this._onDropItem(event, data);
	}

	async _onDropItem(event, data) {
		event.preventDefault();
		const item = await Item.fromDropData(data);
		if (!item) return [];
		return this._handleDroppedItem(event, item);
	}

	_handleDroppedItem(event, item) {}

	_isValidDrop(event, data, displayWarning) {
		const validType = event.target.closest('form[data-drop-type]').dataset
			.dropType;
		const dropType = data.type;
		const isValid = dropType === validType;
		if (!isValid && displayWarning) {
			const warningMsg = game.i18n.format(
				'Madness.Message.Warning.InvalidDropType',
				{
					badType: dropType,
					goodType: validType,
				},
			);
			ui.notifications.warn(warningMsg);
		}
		return isValid;
	}

	activateListeners($html) {
		super.activateListeners($html);

		const html = $html[0];

		const item = this.item;
		const system = this.item.system;

		if (this.isEditable) {
			const contextMenuEntryDelete = {
				name: 'Madness.Controls.Delete',
				icon: fontAwesomeIcon('trash'),
				callback: async ($target) => {
					const itemId = $target[0].closest('[data-item-id]')?.dataset.itemId;
					const i = item.system.items[itemId];
					if (i) {
						delete system.items[itemId];
						const items = foundry.utils.deepClone(system.items);
						if (Object.keys(system.items).length) {
							await item.update({ system: { items: null } });
							await item.update({ 'system.items': items });
						} else {
							item.update({ system: { items: null } });
						}
					}
				},
			};

			new ContextMenu($html, '.detail-item-control', [contextMenuEntryDelete], {
				eventName: 'click',
				onOpen: () => {
					const menu = document.getElementById('context-menu');
					if (menu) {
						const leftPlacement = 1 * Math.floor(0.95 * menu.clientWidth);
						menu.style.right = `${leftPlacement}px`;
					}
				},
			});
		}

		this.activateClickListeners(html);
	}

	activateClickListeners(html) {
		const handlers = {};

		handlers['delete'] = async (event, anchor) => {
			const itemId = anchor.closest('[data-item-id]')?.dataset.itemId;
			const i = this.item.system.items[itemId];
			if (i) {
				delete this.item.system.items[itemId];
				const items = foundry.utils.deepClone(this.item.system.items);
				if (Object.keys(this.item.system.items).length) {
					await this.item.update({ system: { items: null } });
					await this.item.update({ 'system.items': items });
				} else {
					this.item.update({ system: { items: null } });
				}
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
}

export { ItemSheetMadness };
