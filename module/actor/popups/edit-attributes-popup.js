export class EditAttributesPopup extends FormApplication {
	static get defaultOptions() {
		return {
			...super.defaultOptions,
			title: 'Madness.Label.EditAttributes',
			template: 'systems/madness/templates/actor/edit-attributes.hbs',
		};
	}

	getData(options) {
		const sheetData = super.getData(options);
		sheetData.system = this.object.system;
		return sheetData;
	}

	async _updateObject(_event, formData) {
		return this.object.updateAttributes(formData);
	}
}
