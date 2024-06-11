export default class ActorSheetMadness extends ActorSheet {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.classes = ['madness', 'sheet'];
		options.width = 750;
		options.height = 750;
		return options;
	}

	get template() {
		return 'systems/madness/templates/actor/sheet.hbs';
	}
}
