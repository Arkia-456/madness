export class EditAttributesPopup extends FormApplication {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.classes.push(...['madness', 'sheet', 'edit-popup']);
		return {
			...options,
			title: 'Madness.Label.EditAttributes',
			template: 'systems/madness/templates/actor/edit-attributes.hbs',
		};
	}

	getData(options) {
		const sheetData = super.getData(options);
		sheetData.system = this.object.system;
		sheetData.attributesLabels = CONFIG.Madness.attributes;
		return sheetData;
	}

	async _updateObject(_event, formData) {
		return this.object.updateAttributes(formData);
	}
}
