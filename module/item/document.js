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
		// If any created types are "singular", remove existing competing ones.
		const singularTypes = ['ethnicity'];
		const singularTypesToDelete = singularTypes.filter((type) =>
			sources.some((s) => s.type === type),
		);
		const preCreateDeletions = singularTypesToDelete.flatMap(
			(type) => actor.itemTypes[type],
		);
		if (preCreateDeletions.length) {
			const idsToDelete = preCreateDeletions.map((item) => item.id);
			await actor.deleteEmbeddedDocuments('Item', idsToDelete, {
				render: false,
			});
		}
		return super.createDocuments(data, operation);
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
