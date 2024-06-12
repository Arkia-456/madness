export class EditMagicsPopup extends FormApplication {
	static get defaultOptions() {
		return {
			...super.defaultOptions,
			title: 'Madness.Label.EditMagics',
			template: 'systems/madness/templates/actor/edit-magics.hbs',
		};
	}

	getData(options) {
		const sheetData = super.getData(options);
		sheetData.system = this.object.system;
		return sheetData;
	}

	async _updateObject(_event, formData) {
		return this.object.updateMagics(formData);
	}
}
