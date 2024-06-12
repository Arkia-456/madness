export class ModifierMadness {
	constructor(...args) {
		const params = {
			label: args[0],
			modifier: args[1],
		};
		this.label = game.i18n.localize(params.label);
		this.modifier = params.modifier;
	}
}

export class StatisticModifier {
	constructor(label, modifiers) {
		this.label = label;
		const seen = modifiers.reduce((result, modifier) => {
			const existing = result[modifier.label];
			if (
				!existing ||
				Math.abs(modifier.modifier) > Math.abs(result[modifier.label].modifier)
			) {
				result[modifier.label] = modifier;
			}
			return result;
		}, {});
		this._modifiers = Object.values(seen);
		this.calculateTotal();
	}

	calculateTotal() {
		this.totalModifier = this._modifiers.reduce(
			(total, m) => total + m.modifier,
			0,
		);
	}
}
