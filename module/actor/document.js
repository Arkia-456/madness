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
				new Attribute(this, { label: key, modifiers: modifiers }),
				value,
				{ overwrite: false },
			);
			stat.total = stat.totalModifier + stat.value;
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
		hpStat.max = new Formula(CONFIG.Madness.Formulas.HP).evaluate(
			totals,
		)?.evaluated;
		hpStat.value = Math.min(hpStat.value, hpStat.max);
		system.hp = hpStat;

		const manaPoints = system.mp;
		const mpModifiers = [];
		const mpStat = foundry.utils.mergeObject(
			new Attribute(this, { label: 'mp', modifiers: mpModifiers }),
			manaPoints,
			{ overwrite: false },
		);
		mpStat.max = new Formula(CONFIG.Madness.Formulas.MP).evaluate(
			totals,
		)?.evaluated;
		mpStat.value = Math.min(mpStat.value, mpStat.max);
		system.mp = mpStat;

		// Secondary attributes
		system.secondaryAttributes = {};
		Object.entries(CONFIG.Madness.Formulas.Attributes).forEach(
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
				new Attribute(this, { label: key, modifiers: modifiers }),
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
		Object.entries(CONFIG.Madness.Formulas.Magics).forEach(([key, value]) => {
			const modifiers = [];
			const stat = foundry.utils.mergeObject(
				new Attribute(this, { label: key, modifiers: modifiers }),
				{ value: new Formula(value).evaluate(magicTotals)?.evaluated },
				{ overwrite: false },
			);
			stat.total = stat.totalModifier + stat.value;
			system.secondaryMagics[key] = stat;
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

	applyDamage(damage, context) {
		const hitPoints = this.hitPoints;
		if (!hitPoints) return;
		const outcome = context?.parry
			? this._applyParryDamageReduction(damage)
			: damage;

		const damageResult = this._calculateHealthDelta(hitPoints, outcome);
		if (damageResult.totalApplied !== 0) {
			this.update(damageResult.updates);
		}
	}

	_calculateHealthDelta(hp, delta) {
		const updates = {};
		if (hp.max === 0) return { updates, totalApplied: 0 };

		const appliedToTemp = !hp.temp || delta <= 0 ? 0 : Math.min(hp.temp, delta);
		updates['system.hp.temp'] = Math.max(hp.temp - appliedToTemp, 0);

		const appliedToHP = delta - appliedToTemp;
		updates['system.hp.value'] = Math.clamp(hp.value - appliedToHP, 0, hp.max);

		const totalApplied = appliedToTemp + appliedToHP;

		return { updates, totalApplied };
	}

	_applyParryDamageReduction(damage) {
		const parryDamageReduction = this.parryDamageReduction.total ?? 0;
		return Math.ceil(((100 - parryDamageReduction) * damage) / 100);
	}

	addTempHP(value) {
		if (!value) return;
		const hitPoints = this.hitPoints;
		if (!hitPoints) return;
		if (hitPoints.temp >= value) return;
		this.update({ 'system.hp.temp': value });
	}
}

export { ActorMadness };
