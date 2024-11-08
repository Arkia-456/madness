import { displayWarning } from '../../utils/index.js';

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
		const { item } = this;

		// Enriched content
		const enrichedContent = {};
		enrichedContent.description = await TextEditor.enrichHTML(
			item._source.system.description,
		);

		return {
			...sheetData,
			system: item.system,
			enrichedContent,
			detailsTemplate: `madness.item.${item.type}.details`,
		};
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

	_handleDroppedItem(event, item) {
		const itemSource = item.toObject();
		if (!this._isValidDrop(item, true)) {
			return;
		}
		this._onDropItemCreate(
			new Item.implementation(itemSource).clone().toObject(),
		);
	}

	_onDropItemCreate(itemData) {
		this.item.createItem(itemData);
	}

	_isValidDrop(data, displayMessage = false) {
		const validTypes = this._droppables ?? [];
		const dropType = data.type;
		const isValid = validTypes.includes(dropType);
		if (validTypes.length && !isValid && displayMessage) {
			displayWarning('Madness.Message.Warning.InvalidDropType', {
				badType: dropType,
				goodType: validTypes.join(', '),
			});
		}
		return isValid;
	}

	activateListeners($html) {
		super.activateListeners($html);
		const html = $html[0];
		this.activateClickListeners(html);
	}

	async _deleteItem(id) {
		const items = this.item.system.items;
		const item = items[id];
		if (!item) return;
		delete items[id];
		await this.item.updateItems(null);
		await this.item.updateItems(items);
	}

	activateClickListeners(html) {
		const handlers = {};

		handlers['delete'] = (event, anchor) => {
			const itemId = anchor.closest('[data-item-id]')?.dataset.itemId;
			this._deleteItem(itemId);
		};

		const sheetHandler = async (event) => {
			const actionTarget = event.target.closest(
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
