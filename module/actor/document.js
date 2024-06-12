import { Formula, capitalizeFirstLetter } from '../../utils/index.js';
import { ModifierMadness, Attribute } from './modifiers.js';

class ActorMadness extends Actor {
	prepareBaseData() {
		console.log('Madness system | Actor | Preparing base data...');
		super.prepareBaseData();

		// Data properties from items
		this.ethnicity = null;

		// Attributes
		const attributes = this.system.attributes;
		Object.entries(attributes).forEach(([key, value]) => {
			value.ethnicity = 0;
		});
		console.log('Madness system | Actor | Base data prepared ✅');
	}

	prepareDerivedData() {
		console.log('Madness system | Actor | Preparing derived data...');
		super.prepareDerivedData();

		const system = this.system;

		// Attributes modifiers from items

		Object.entries(system.attributes).forEach(([key, value]) => {
			const modifiers = [];
			const modifierTypes = ['ethnicity'];
			modifierTypes.forEach((type) => {
				if (value[type]) {
					modifiers.push(this.generateAttributeModifier(key, type));
				}
			});
			const stat = foundry.utils.mergeObject(
				new Attribute(key, modifiers),
				value,
				{ overwrite: false },
			);
			stat.total = stat.totalModifier + stat.value;
			system.attributes[key] = stat;
		});

		// Secondary attributes
		const totals = {};
		Object.entries(system.attributes).forEach(
			([key, value]) => (totals[key] = value.total),
		);
		system.secondaryAttributes = {};
		Object.entries(CONFIG.Madness.Formulas.Attributes).forEach(
			([key, value]) => {
				const modifiers = [];
				const stat = foundry.utils.mergeObject(
					new Attribute(key, modifiers),
					{ value: new Formula(value).compute(totals)?.evaluated },
					{ overwrite: false },
				);
				stat.total = stat.totalModifier + stat.value;
				system.secondaryAttributes[key] = stat;
			},
		);

		const rollableSecondaryAttributes = ['critRate', 'dodgeRate', 'initiative'];
		rollableSecondaryAttributes.forEach(
			(attr) => (system.secondaryAttributes[attr].rollable = true),
		);

		// Magics modifiers

		Object.entries(system.magics).forEach(([key, value]) => {
			const modifiers = [];
			const modifierTypes = [];
			modifierTypes.forEach((type) => {
				if (value[type]) {
					modifiers.push(this.generateAttributeModifier(key, type));
				}
			});
			const stat = foundry.utils.mergeObject(
				new Attribute(key, modifiers),
				value,
				{ overwrite: false },
			);
			stat.total = stat.totalModifier + stat.value;
			system.magics[key] = stat;
		});

		console.log('Madness system | Actor | Derived data prepared ✅');
	}

	generateAttributeModifier(key, type) {
		const attr = this.system.attributes[key][type];
		return new ModifierMadness(
			`Madness.${capitalizeFirstLetter(type)}${capitalizeFirstLetter(key)}`,
			capitalizeFirstLetter(type),
			attr,
		);
	}

	updateAttributes(attributes) {
		Object.entries(attributes).forEach(([key, value]) => {
			this.system.attributes[key].value = value;
		});
		this.update({ 'system.attributes': this.system.attributes });
	}

	updateMagics(magics) {
		Object.entries(magics).forEach(([key, value]) => {
			this.system.magics[key].value = value;
		});
		this.update({ 'system.magics': this.system.magics });
	}

	prepareEmbeddedDocuments() {
		console.log('Madness system | Actor | Preparing embedded documents...');
		super.prepareEmbeddedDocuments();
		this.prepareDataFromItems();
		console.log('Madness system | Actor | Embedded documents prepared ✅');
	}

	prepareDataFromItems() {
		console.log('Madness system | Actor | Preparing data from items...');
		for (const item of this.items) {
			item.prepareActorData?.();
		}
		console.log('Madness system | Actor | Data from items prepared ✅');
	}

	getAttribute(attr) {
		return this.system.attributes[attr];
	}

	getSecondaryAttribute(attr) {
		return this.system.secondaryAttributes[attr];
	}
}

export { ActorMadness };
