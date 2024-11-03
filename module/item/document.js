import { ChatMessageMadness } from '../chat-message/index.js';
import { Formula } from '../../utils/index.js';

class ItemMadness extends Item {
	createItem(data, operation = {}) {
		operation.parent = this;
		operation.pack = this.pack;
		const cls = getDocumentClass('Item');
		const id = foundry.utils.randomID(16);
		data._id = id;
		const document = new cls(data, operation);
		document.item = this;
		const items = this.system.items ?? {};
		items[id] = document;
		this.updateItems(items);
	}

	updateItems(data) {}

	async delete(operation) {
		if (this.actor) {
			await this.actor.deleteEmbeddedDocuments('Item', [this.id], operation);
			return this;
		}
		return super.delete(operation);
	}

	static async createDocuments(data, operation) {
		const sources = data.map((d) =>
			d instanceof ItemMadness ? d.toObject() : d,
		);
		const actor = operation.parent;
		if (!actor) return super.createDocuments(sources, operation);
		await ItemMadness.preCreateDelete(sources, actor);
		return super.createDocuments(data, operation);
	}

	static async preCreateDelete(sources, actor) {
		const idsToDelete = [];
		idsToDelete.push(...ItemMadness.getSingularTypesToDelete(sources, actor));
		idsToDelete.push(
			...ItemMadness.getSingularItemPerTypeToDelete(sources, actor),
		);
		if (idsToDelete.length) {
			await actor.deleteEmbeddedDocuments('Item', idsToDelete, {
				render: false,
			});
		}
	}

	getMinDamage(attributes) {
		return this.getMinMaxDamage('min', attributes);
	}

	getMaxDamage(attributes) {
		return this.getMinMaxDamage('max', attributes);
	}

	getMinMaxDamage(minMax, attributes) {
		const damageFormula =
			Formula.generateCalculableFormulaFromDice(
				this.system.damage,
				this.damageMod,
			) || '0';
		const values = {};
		Object.entries(attributes).forEach(
			([attr, value]) => (values[attr] = minMax === 'max' ? value.total : 1),
		);
		return new Formula(damageFormula).evaluate(values).evaluated;
	}

	static getSingularTypesToDelete(sources, actor) {
		const singularTypes = ['ethnicity'];
		const singularTypesToDelete = singularTypes.filter((type) =>
			sources.some((s) => s.type === type),
		);
		const itemsToDelete = singularTypesToDelete.flatMap(
			(type) => actor.itemTypes[type],
		);
		return itemsToDelete.map((item) => item.id);
	}

	static getSingularItemPerTypeToDelete(sources, actor) {
		const types = ['equipment'];
		const typesToManage = types.filter((type) =>
			sources.some((s) => s.type === type),
		);
		const items = typesToManage.flatMap((type) => actor.itemTypes[type]);
		const sourcesSlots = sources.map((s) => s.system.slot);
		const itemsToDelete = items.filter((i) =>
			sourcesSlots.includes(i.system.slot),
		);
		return itemsToDelete.map((i) => i.id);
	}

	async toMessage(options) {
		const template = `systems/madness/templates/chat/${this.type}-card.hbs`;
		const actor = this.actor;
		const token = actor.token;
		const templateData = {
			actor,
			item: this,
			roll: options.roll,
			// In card add magics icons
		};

		const outcome = options.roll.outcome;

		const contextFlag = {
			outcome,
			...options.context,
		};

		const chatData = {
			speaker: ChatMessageMadness.getSpeaker({
				actor: this.actor,
				token: token,
			}),
			content: await renderTemplate(template, templateData),
			flags: {
				madness: {
					context: contextFlag,
					origin: this.getOriginData(),
				},
			},
		};

		ChatMessageMadness.create(chatData);
	}

	getOriginData() {
		return {
			actor: this.actor?.uuid,
			uuid: this.uuid,
			type: this.type,
		};
	}
}

const ItemProxyMadness = new Proxy(ItemMadness, {
	construct(_target, args) {
		const type = args[0]?.type;
		const ItemClass = CONFIG.Madness.Item.documentClasses[type];
		if (!ItemClass) {
			throw new Error(`Item type ${type} does not exist`);
		}
		return new ItemClass(...args);
	},
});

export { ItemMadness, ItemProxyMadness };
