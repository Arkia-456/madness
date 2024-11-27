export class EditMagicsPopup extends FormApplication {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.classes.push(...['madness', 'sheet', 'edit-popup']);
		return {
			...options,
			title: 'Madness.Label.EditMagics',
			template: 'systems/madness/templates/actor/edit-magics.hbs',
		};
	}

	getData(options) {
		return {
			...super.getData(options),
			magics: Object.entries(CONFIG.Madness.magics).reduce(
				(magics, [id, m]) => {
					magics[id] = m.label;
					return magics;
				},
				{},
			),
			system: this.object.system,
		};
	}

	async _updateObject(_event, formData) {
		return this.object.updateMagics(formData);
	}
}
