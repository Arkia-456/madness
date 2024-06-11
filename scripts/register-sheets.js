import ActorSheetMadness from '../module/actor/sheet.js';
export function registerSheets() {
	Actors.unregisterSheet('core', ActorSheet);
	Actors.registerSheet('madness', ActorSheetMadness, {
		makeDefault: true,
	});
}
