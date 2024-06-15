import { ItemMadness } from '../index.js';

class SpellMadness extends ItemMadness {
	async updateItems(items) {
		await this.update({ 'system.items': items });
	}
}

export { SpellMadness };
