class ItemMadness extends Item {
	prepareActorData() {
		console.log('Madness system | Actor | Preparing actor data...');
		const actor = this.actor;
		actor.ethnicity = this;
		Object.entries(this.system.attributes).forEach(([key, value]) => {
			actor.system.attributes[key].ethnicity = value.value;
		});
		console.log('Madness system | Actor | Actor data prepared ✅');
	}

	async delete(operation) {
		if (this.actor) {
			await this.actor.deleteEmbeddedDocuments('Item', [this.id], operation);
			return this;
		}
		return super.delete(operation);
	}

	static async createDocuments(data, operation) {
		const actor = operation.parent;
		const sources = data.map((d) =>
			d instanceof ItemMadness ? d.toObject() : d,
		);
		await ItemMadness.preCreateDelete(sources, actor);
		return super.createDocuments(data, operation);
	}

	static async preCreateDelete(sources, actor) {
		const idsToDelete = [];
		idsToDelete.push(...ItemMadness.getSingularTypesToDelete(sources, actor));
		if (idsToDelete.length) {
			await actor.deleteEmbeddedDocuments('Item', idsToDelete, {
				render: false,
			});
		}
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
