export default class ItemSheetMadness extends ItemSheet {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.classes.push('madness', 'item');
		options.width = 695;
		options.height = 460;
		options.template = 'systems/madness/templates/item/sheet.hbs';
		return options;
	}

	async getData(options) {
		const sheetData = super.getData(options);
		const item = this.item;
		sheetData.system = item.system;

		// Enriched content
		const enrichedContent = {};
		enrichedContent.description = await TextEditor.enrichHTML(
			item._source.system.description,
		);
		sheetData.enrichedContent = enrichedContent;

		return sheetData;
	}
}
