import { ItemSheetMadness } from '../index.js';

class WeaponSheetMadness extends ItemSheetMadness {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.template = 'systems/madness/templates/item/weapon/sheet.hbs';
		return options;
	}
}

export { WeaponSheetMadness };
