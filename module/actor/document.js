import { capitalizeFirstLetter } from '../../utils/index.js';
import { ModifierMadness, StatisticModifier } from './modifiers.js';

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

		Object.entries(system.attributes).forEach(([key, value]) => {
			const ethnicityAttr = system.attributes[key].ethnicity;
			const modifiers = [
				new ModifierMadness(
					`Madness.Ethnicity${capitalizeFirstLetter(key)}`,
					ethnicityAttr,
				),
			];
			const stat = foundry.utils.mergeObject(
				new StatisticModifier(key, modifiers),
				value,
				{ overwrite: false },
			);
			stat.value = stat.totalModifier;
			system.attributes[key] = stat;
		});

		console.log('Madness system | Actor | Derived data prepared ✅');
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
}

export { ActorMadness };
