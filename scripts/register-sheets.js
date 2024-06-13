import { ActorSheetMadness } from '../module/actor/index.js';
import {
	EffectSheetMadness,
	EthnicitySheetMadness,
} from '../module/item/index.js';

export function registerSheets() {
	Actors.unregisterSheet('core', ActorSheet);
	Actors.registerSheet('madness', ActorSheetMadness, {
		makeDefault: true,
	});

	Items.unregisterSheet('core', ItemSheet);
	Items.registerSheet('madness', EthnicitySheetMadness, {
		types: ['ethnicity'],
		makeDefault: true,
	});

	Items.registerSheet('madness', EffectSheetMadness, {
		types: ['effect'],
		makeDefault: true,
	});
}
