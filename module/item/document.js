import { ChatMessageMadness } from '../chat-message/index.js';
import { Formula } from '../../utils/index.js';

class ItemMadness extends Item {
	prepareActorData() {
		console.log(
			`Madness system | Actor | ${this.actor.name} | Equipment | ${this.name} | Preparing actor data...`,
		);

		if (this.system.passives) this._preparePassives();

		console.log(
			`Madness system | Actor | ${this.actor.name} | Equipment | ${this.name} | Actor data prepared ✅`,
		);
	}

	_preparePassives() {
		const actor = this.actor;

		const primaryAttributes = Object.keys(actor.system.attributes);
		const secondaryAttributes = Object.keys(CONFIG.Madness.formulas.attributes);
		const magics = Object.keys(actor.system.magics);
		const secondaryMagics = Object.keys(CONFIG.Madness.formulas.magics);
		const statusEffects = Object.keys(CONFIG.Madness.statusEffects.list);

		Object.values(this.system.passives).forEach((p) => {
			if (!p.active) return;

			// Primary attributes modifiers
			if (primaryAttributes.includes(p.passive)) {
				actor.system.attributes[p.passive].passives =
					(actor.system.attributes[p.passive].passives ?? 0) + p.strength;
				return;
			}

			// Secondary attributes modifiers
			if (secondaryAttributes.includes(p.passive)) {
				actor.system.secondaryAttributes[p.passive].passives =
					(actor.system.secondaryAttributes[p.passive].passives ?? 0) +
					p.strength;
				return;
			}

			// Magics modifiers
			if (magics.includes(p.passive)) {
				actor.system.magics[p.passive].passives =
					(actor.system.magics[p.passive].passives ?? 0) + p.strength;
				return;
			}

			// Secondary magics modifiers
			if (secondaryMagics.includes(p.passive)) {
				actor.system.secondaryMagics[p.passive].passives =
					(actor.system.secondaryMagics[p.passive].passives ?? 0) + p.strength;
				return;
			}

			// HP/MP/armor modifiers
			if (p.passive === 'hp' || p.passive === 'mp' || p.passive === 'armor') {
				actor.system[p.passive].passives =
					(actor.system[p.passive].passives ?? 0) + p.strength;
				return;
			}

			if (statusEffects.includes(p.passive)) {
				actor.system.immunities.push(p.passive);
				return;
			}
		});
	}

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

	createPassive() {
		const data = { name: null, passive: null, strength: null };
		const id = foundry.utils.randomID(16);
		this.system.passives[id] = data;
		this.update({ 'system.passives': this.system.passives });
	}

	updateItems(data) {
		throw new Error('Method not implemented.');
	}

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
		const ItemClass = CONFIG.Madness.item.documentClasses[type];
		if (!ItemClass) {
			throw new Error(`Item type ${type} does not exist`);
		}
		return new ItemClass(...args);
	},
});

export { ItemMadness, ItemProxyMadness };
