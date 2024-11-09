import {
	Formula,
	capitalizeFirstLetter,
	createHTMLElement,
	elide,
} from '../../utils/index.js';
import { ChatMessageMadness } from '../chat-message/index.js';
import { CheckMadness } from '../system/check.js';
import { ModifierMadness, Attribute } from './modifiers.js';

class ActorMadness extends Actor {
	get critRate() {
		return this.system.secondaryAttributes?.critRate;
	}

	get dodgeRate() {
		return this.system.secondaryAttributes?.dodgeRate;
	}

	get parryDamageReduction() {
		return this.system.secondaryAttributes?.parryDamageReduction;
	}

	get attributesTotals() {
		const totals = {};
		Object.entries(this.system.attributes).forEach(
			([key, value]) => (totals[key] = value.total),
		);
		return totals;
	}

	get magicsTotals() {
		const totals = {};
		Object.entries(this.system.magics).forEach(
			([key, value]) => (totals[key] = value.total),
		);
		return totals;
	}

	get currentMP() {
		return this.system.mp.value;
	}

	get hitPoints() {
		return this.system.hp;
	}

	get equipments() {
		return this.items.filter((i) => i.type === 'equipment');
	}

	get weapons() {
		return this.items.filter((i) => i.type === 'weapon');
	}

	get criticalFailureRateMod() {
		return Math.max(0, this._getCriticalFailureModEffects());
	}

	_getCriticalFailureModEffects() {
		return this.effects.reduce((rate, effect) => {
			return (
				rate +
				(effect.system.effects?.reduce((r, e) => {
					return e.name === 'increaseCriticalFailureRate' ? r + e.value : r;
				}, 0) ?? 0)
			);
		}, 0);
	}

	static async createDocuments(data, operation) {
		const sources = data.map((d) =>
			d instanceof ActorMadness ? d.toObject() : d,
		);
		sources.forEach((source) => {
			const merged = foundry.utils.mergeObject(source, { prototypeToken: {} });
			if (source.type === 'character') {
				merged.prototypeToken.actorLink = true;
			}
		});

		return super.createDocuments(sources, operation);
	}

	prepareBaseData() {
		console.log(
			`Madness system | Actor | ${this.name} | Preparing base data...`,
		);
		super.prepareBaseData();

		// Data properties from items
		this.ethnicity = null;

		// Attributes
		const attributes = this.system.attributes;
		Object.entries(attributes).forEach(([key, value]) => {
			value.ethnicity = 0;
		});
		console.log(
			`Madness system | Actor | ${this.name} | Base data prepared ✅`,
		);
	}

	prepareDerivedData() {
		console.log(
			`Madness system | Actor | ${this.name} | Preparing derived data...`,
		);
		super.prepareDerivedData();

		const system = this.system;

		// Attributes modifiers from items

		Object.entries(system.attributes).forEach(([key, value]) => {
			const modifiers = [];
			const modifierTypes = ['ethnicity', 'effects'];
			modifierTypes.forEach((type) => {
				if (value[type]) {
					modifiers.push(this.generateAttributeModifier(key, type));
				}
			});
			const stat = foundry.utils.mergeObject(
				new Attribute(this, { label: key, modifiers: modifiers }),
				value,
				{ overwrite: false },
			);
			stat.total = Math.max(0, stat.totalModifier + stat.value);
			system.attributes[key] = stat;
		});

		const totals = {};
		Object.entries(system.attributes).forEach(
			([key, value]) => (totals[key] = value.total),
		);

		// Calculate HP and MP
		const hitPoints = system.hp;
		const hpModifiers = [];
		const hpStat = foundry.utils.mergeObject(
			new Attribute(this, { label: 'hp', modifiers: hpModifiers }),
			hitPoints,
			{ overwrite: false },
		);
		hpStat.max = new Formula(CONFIG.Madness.formulas.hp).evaluate(
			totals,
		)?.evaluated;
		if (hpStat.value > hpStat.max) {
			this.update({ 'system.hp.value': hpStat.max });
		}
		hpStat.value = Math.min(hpStat.value, hpStat.max);
		system.hp = hpStat;

		const manaPoints = system.mp;
		const mpModifiers = [];
		const mpStat = foundry.utils.mergeObject(
			new Attribute(this, { label: 'mp', modifiers: mpModifiers }),
			manaPoints,
			{ overwrite: false },
		);
		mpStat.max = new Formula(CONFIG.Madness.formulas.mp).evaluate(
			totals,
		)?.evaluated;
		if (mpStat.value > mpStat.max) {
			this.update({ 'system.mp.value': mpStat.max });
		}
		mpStat.value = Math.min(mpStat.value, mpStat.max);
		system.mp = mpStat;

		// Secondary attributes
		system.secondaryAttributes = {};
		Object.entries(CONFIG.Madness.formulas.attributes).forEach(
			([key, value]) => {
				const modifiers = [];
				const stat = foundry.utils.mergeObject(
					new Attribute(this, { label: key, modifiers: modifiers }),
					{ value: new Formula(value).evaluate(totals)?.evaluated },
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
				new Attribute(this, {
					type: 'magics',
					label: key,
					modifiers: modifiers,
				}),
				value,
				{ overwrite: false },
			);
			stat.total = stat.totalModifier + stat.value;
			system.magics[key] = stat;
		});

		const magicTotals = {};
		Object.entries(system.magics).forEach(
			([key, value]) => (magicTotals[key] = value.total),
		);

		system.secondaryMagics = {};
		Object.entries(CONFIG.Madness.formulas.magics).forEach(([key, value]) => {
			const modifiers = [];
			const stat = foundry.utils.mergeObject(
				new Attribute(this, {
					type: 'magics',
					label: key,
					modifiers: modifiers,
				}),
				{ value: new Formula(value).evaluate(magicTotals)?.evaluated },
				{ overwrite: false },
			);
			stat.total = stat.totalModifier + stat.value;
			system.secondaryMagics[key] = stat;
		});

		// Armor
		system.armor =
			this.equipments.reduce(
				(armor, e) => (armor += Number(e.system.armor)),
				0,
			) +
			this.weapons.reduce(
				(armor, w) => (armor += Number(w.getPassiveModifier('increaseArmor'))),
				0,
			);

		// Weight
		const equipments = this.items.filter(
			(i) => i.type === 'equipment' || i.type === 'weapon',
		);
		system.currentEquipmentWeight = equipments.reduce(
			(weight, e) => (weight += Number(e.system.weight)),
			0,
		);

		console.log(
			`Madness system | Actor | ${this.name} | Derived data prepared ✅`,
		);
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
		console.log(
			`Madness system | Actor | ${this.name} | Preparing embedded documents...`,
		);
		super.prepareEmbeddedDocuments();
		this.prepareDataFromItems();
		this.prepareDataFromEffects();
		console.log(
			`Madness system | Actor | ${this.name} | Embedded documents prepared ✅`,
		);
	}

	prepareDataFromItems() {
		console.log(
			`Madness system | Actor | ${this.name} | Preparing data from items...`,
		);
		for (const item of this.items) {
			item.prepareActorData?.();
		}
		console.log(
			`Madness system | Actor | ${this.name} | Data from items prepared ✅`,
		);
	}

	prepareDataFromEffects() {
		console.log(
			`Madness system | Actor | ${this.name} | Preparing data from effects...`,
		);
		for (const effect of this.effects) {
			effect.prepareActorData?.();
		}
		console.log(
			`Madness system | Actor | ${this.name} | Data from items effects ✅`,
		);
	}

	getAttribute(attr) {
		return this.system.attributes[attr];
	}

	getSecondaryAttribute(attr) {
		return this.system.secondaryAttributes[attr];
	}

	removeMP(mp) {
		this.update({ 'system.mp.value': this.system.mp.value - mp });
	}

	async dodge(token) {
		const context = {
			actor: this,
			rollType: 'dodge',
		};
		const roll = (await CheckMadness.roll(context)).critOutcome;
		if (!roll.isCritical) {
			roll.result =
				roll.roll.total > 100 - this.dodgeRate.total ? 'success' : 'failure';
		}
		const title = `${elide(game.i18n.localize('Madness.ChatMessage.CheckOf'), this.dodgeRate.label)}${this.dodgeRate.label.toLowerCase()}`;
		const flavor = createHTMLElement('h4', [title]).outerHTML;
		const templateData = {
			roll,
		};
		const chatData = {
			speaker: ChatMessageMadness.getSpeaker({
				actor: this,
				token,
			}),
			content: await renderTemplate(
				'systems/madness/templates/chat/dodge-card.hbs',
				templateData,
			),
			flavor,
		};
		ChatMessageMadness.create(chatData);
		return roll;
	}

	async parry(token) {
		const context = {
			actor: this,
			rollType: 'parry',
		};
		const roll = (await CheckMadness.roll(context)).critOutcome;
		const title = `${elide(game.i18n.localize('Madness.ChatMessage.CheckOf'), this.critRate.label)}${this.critRate.label.toLowerCase()}`;
		const flavor = createHTMLElement('h4', [title]).outerHTML;
		const templateData = {
			roll,
		};
		const chatData = {
			speaker: ChatMessageMadness.getSpeaker({
				actor: this,
				token,
			}),
			content: await renderTemplate(
				'systems/madness/templates/chat/parry-card.hbs',
				templateData,
			),
			flavor,
		};
		ChatMessageMadness.create(chatData);
		return roll;
	}

	applyDamage(damage = 0, context = {}) {
		const hitPoints = this.hitPoints;
		if (!hitPoints) return;
		const outcomeAfterParry = context?.parry
			? this._applyParryDamageReduction(damage)
			: damage;
		const outcomeAfterArmor = this._applyArmorDamageReduction(
			outcomeAfterParry,
			context.passives,
		);
		context.passives.forEach((p) => {
			if (p.slug && CONFIG.statusEffects.some((e) => e.id === p.slug)) {
				this.increaseStatusEffect(p.slug);
			}
		});
		const damageResult = this._calculateHealthDelta(
			hitPoints,
			outcomeAfterArmor,
			context,
		);
		if (damageResult.totalApplied !== 0) {
			this.update(damageResult.updates);
		}
	}

	_calculateHealthDelta(hp, delta, context) {
		const updates = {};
		if (hp.max === 0) return { updates, totalApplied: 0 };

		const removeTempHPPassive =
			context.passives?.filter((p) => p.name === 'removeTempHP') ?? [];
		const bypassTempHPPassive =
			context.passives?.filter((p) => p.name === 'bypassTempHP') ?? [];
		const appliedToTemp =
			removeTempHPPassive.length ||
			bypassTempHPPassive.length ||
			!hp.temp ||
			delta <= 0
				? 0
				: Math.min(hp.temp, delta);
		updates['system.hp.temp'] = removeTempHPPassive.length
			? 0
			: Math.max(hp.temp - appliedToTemp, 0);

		let additionalDamage = 0;
		const appliedToHP = delta - appliedToTemp;
		if (!(context?.source === 'activeEffect') && appliedToHP > 0) {
			additionalDamage = this.effects.reduce((damage, effect) => {
				return (
					damage +
						effect.system.effects?.reduce((total, e) => {
							const stacks = effect.system.stacks ?? 1;
							const value = e.value * stacks;
							return e.name === 'increaseDamageToHealth'
								? total + value
								: total;
						}, 0) ?? 0
				);
			}, 0);
		}

		const toApply = appliedToHP + additionalDamage;
		updates['system.hp.value'] = Math.clamp(hp.value - toApply, 0, hp.max);

		const totalApplied = appliedToTemp + appliedToHP;

		return { updates, totalApplied };
	}

	_applyParryDamageReduction(damage) {
		const parryDamageReduction = this.parryDamageReduction.total ?? 0;
		return Math.ceil(((100 - parryDamageReduction) * damage) / 100);
	}

	_applyArmorDamageReduction(damage, passives = []) {
		if (passives.some((p) => p.name === 'ignoreArmor')) {
			return damage;
		}
		return damage > 0 ? Math.max(1, damage - this.system.armor) : damage;
	}

	addTempHP(value) {
		if (!value) return;
		const hitPoints = this.hitPoints;
		if (!hitPoints) return;
		if (hitPoints.temp >= value) return;
		this.update({ 'system.hp.temp': value });
	}

	checkWeight(item) {
		let newWeight = this.weapons.reduce(
			(weight, w) => (weight += Number(w.system.weight)),
			Number(item.system.weight),
		);
		newWeight += this.equipments.reduce((weight, e) => {
			return item.type === 'equipment' && e.system.slot === item.system.slot
				? weight
				: (weight += Number(e.system.weight));
		}, 0);
		return (
			newWeight <= this.system.secondaryAttributes.maxEquipmentWeight.total
		);
	}

	checkWeaponSlots() {
		return (
			this.system.secondaryAttributes.inventoryMaxSlots.total >
			this.weapons.length
		);
	}

	decreaseStatusEffect(statusId) {
		const existing = this.effects.find((e) => e.system.slug === statusId);
		if (!existing) return;

		const stacks = existing.system.stacks ?? 1;
		if (stacks > 1) {
			const newValue = stacks - 1;
			return existing.update({ 'system.stacks': newValue });
		} else {
			return this.toggleStatusEffect(statusId);
		}
	}

	async increaseStatusEffect(statusId) {
		const existing = this.effects.find((e) => e.system.slug === statusId);
		if (!existing) {
			const statusEffect = await this.toggleStatusEffect(statusId);
			if (statusEffect.system.stackable) {
				this.increaseStacks(statusEffect, 1);
			}
			return statusEffect;
		}

		if (!existing.system.stackable) return;

		return this.increaseStacks(existing, 1);
	}

	increaseStacks(statusEffect, num = 1) {
		const currentValue = statusEffect.system.stacks ?? 0;
		const newValue = currentValue + num;
		return statusEffect.update({ 'system.stacks': newValue });
	}

	toggleStatusEffects(statusIds) {
		const promises = [];
		statusIds.forEach((statusId) =>
			promises.push(this.toggleStatusEffect(statusId)),
		);
		return Promise.all(promises);
	}

	decreaseStatusEffectsDuration(statusIds, durationFilterCallback) {
		const promises = [];
		statusIds.forEach((statusId) =>
			promises.push(
				this.decreaseStatusEffectDuration(statusId, durationFilterCallback),
			),
		);
		return Promise.all(promises);
	}

	decreaseStatusEffectDuration(statusId, durationFilterCallback) {
		const existing = this.effects.find((e) => e.system.slug === statusId);
		if (!existing) return;

		const durations = foundry.utils.deepClone(existing.system.durations);
		const duration = durations.find(durationFilterCallback);
		const durationIndex = existing.system.durations.findIndex(
			durationFilterCallback,
		);
		const newValue = duration.value - 1;
		durations[durationIndex].value = newValue;
		return existing.update({
			['system.durations']: durations,
		});
	}

	checkMP(value) {
		if (isNaN(value)) throw new Error('Invalid value');
		return this.currentMP >= value;
	}
}

export { ActorMadness };
