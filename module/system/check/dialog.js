class CheckModifiersDialogMadness extends FormApplication {
	constructor(check, resolve, context) {
		super();

		this.check = check;
		this.resolve = resolve;
		this.context = context;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			template: 'systems/madness/templates/dialog/check-modifiers.hbs',
			classes: ['madness'],
			popOut: true,
			width: 380,
			height: 'auto',
			title: 'Madness.Dialog.Modifiers',
		});
	}

	getData(options) {
		return {
			...super.getData(options),
			context: this.context,
			attributes: {
				...CONFIG.Madness.attributes,
				critFailureRate: 'Madness.Attributes.CriticalFailureRate',
				damage: 'Madness.Label.DamagePlural',
			},
		};
	}

	activateListeners($html) {
		super.activateListeners($html);
		const html = $html[0];
		this._activateClickListeners(html);
	}

	_activateClickListeners(html) {
		html.querySelector('button[data-action]')?.addEventListener('click', () => {
			this.validated = true;
		});
	}

	async close(options = {}) {
		this.resolve(this.validated);
		super.close(options);
	}

	async _updateObject(event, formData) {
		Object.entries(formData).forEach(
			([attr, value]) => (this.check[attr] = value ?? 0),
		);
	}
}

export { CheckModifiersDialogMadness };
