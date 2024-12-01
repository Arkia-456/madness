import { ActorSheetMadness } from '../module/actor/index.js';
import {
	EffectSheetMadness,
	EquipmentSheetMadness,
	EthnicitySheetMadness,
	ItemSheetMadness,
	SpellSheetMadness,
	WeaponSheetMadness,
} from '../module/item/index.js';

export function registerSheets() {
	Actors.unregisterSheet('core', ActorSheet);
	Actors.registerSheet('madness', ActorSheetMadness, {
		makeDefault: true,
	});

	Items.unregisterSheet('core', ItemSheet);
	Items.registerSheet('madness', EquipmentSheetMadness, {
		types: ['equipment'],
		makeDefault: true,
	});
	Items.registerSheet('madness', EthnicitySheetMadness, {
		types: ['ethnicity'],
		makeDefault: true,
	});

	Items.registerSheet('madness', EffectSheetMadness, {
		types: ['effect'],
		makeDefault: true,
	});
	Items.registerSheet('madness', ItemSheetMadness, {
		types: ['generic'],
		makeDefault: true,
	});
	Items.registerSheet('madness', SpellSheetMadness, {
		types: ['spell'],
		makeDefault: true,
	});
	Items.registerSheet('madness', WeaponSheetMadness, {
		types: ['consumable-weapon', 'weapon'],
		makeDefault: true,
	});
}
