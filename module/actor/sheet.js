export default class ActorSheetMadness extends ActorSheet {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.classes = ['madness', 'sheet'];
		options.width = 750;
		options.height = 750;
		options.tabs = [
			{
				navSelector: 'nav.sheet-navigation',
				contentSelector: '.sheet-content',
				initial: 'character',
			},
		];
		return options;
	}

	get template() {
		return 'systems/madness/templates/actor/sheet.hbs';
	}

	async getData(options) {
		const sheetData = await super.getData(options);
		const actor = this.actor;
		sheetData.system = actor.system;
		return sheetData;
	}
}
