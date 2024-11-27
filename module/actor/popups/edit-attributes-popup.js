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
		return {
			...super.getData(options),
			attributesLabels: CONFIG.Madness.attributes,
			system: this.object.system,
		};
	}

	async _updateObject(_event, formData) {
		return this.object.updateAttributes(formData);
	}
}
