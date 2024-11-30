import {
	Formula,
	capitalizeFirstLetter,
	createHTMLElement,
	elide,
	objectMap,
} from '../../utils/index.js';
import { ChatMessageMadness } from '../chat-message/index.js';
import { CheckMadness } from '../system/check/check.js';
import { ModifierMadness, Attribute } from './modifiers.js';

export class ActorMadness extends Actor {
	static MODIFIERS_SOURCES = ['ethnicity', 'effects', 'passives'];

	/* ------------------------------- */
	/*  Stats                          */
	/* ------------------------------- */

	get hitPoints() {
		return this.system.hp;
	}

	get currentMP() {
		return this.system.mp.value;
	}

	get critRate() {
		return this.system.secondaryAttributes?.critRate;
	}

	get criticalFailureRateMod() {
		return Math.max(
			0,
			this.effects.reduce((rate, effect) => {
				return (
					rate +
					(effect.system.effects?.reduce((r, e) => {
						return e.type === 'statModifier' && e.target === 'critFailureRate'
							? r + e.value
							: r;
					}, 0) ?? 0)
				);
			}, 0),
		);
	}

	get dodgeRate() {
		return this.system.secondaryAttributes?.dodgeRate;
	}

	get parryDamageReduction() {
		return this.system.secondaryAttributes?.parryDamageReduction;
	}

	get attributesTotals() {
		return objectMap(this.system.attributes, (attr) => attr.total);
	}

	get magicsTotals() {
		return objectMap(this.system.magics, (m) => m.total);
	}

	/* ------------------------------- */
	/*  Items                          */
	/* ------------------------------- */

	get equipments() {
		return this.items.filter((i) => i.type === 'equipment');
	}

	get genericItems() {
		return this.items.filter((i) => i.type === 'generic');
	}

	get spells() {
		return this.items.filter((i) => i.type === 'spell');
	}

	get weapons() {
		return this.items.filter((i) => i.type === 'weapon');
	}

	/* ------------------------------- */
	/*  Effects                        */
	/* ------------------------------- */

	get parryEffects() {
		const effects = this.effects.filter((statusEffect) =>
			statusEffect.system.effects?.some(
				(e) => e.type === 'prevent' && e.target === 'parry',
			),
		);
		return { canParry: !effects.length, effects: effects };
	}

	get dodgeEffects() {
		const effects = this.effects.filter((statusEffect) =>
			statusEffect.system.effects?.some(
				(e) => e.type === 'prevent' && e.target === 'dodge',
			),
		);
		return { canDodge: !effects.length, effects: effects };
	}

	/* ------------------------------- */
	/*  Other                          */
	/* ------------------------------- */

	get canUseMagic() {
		return this.preventMagicUseEffects.length > 0;
	}

	get firstUpdater() {
		const { activeGM } = game.users;
		if (activeGM) return activeGM;

		const activePlayers = game.users.filter((u) => u.active);
		const primaryOwner = activePlayers.find(
			(u) => u.character?.id === this.id && this.ownership[u.id] === 3,
		);
		if (primaryOwner) return primaryOwner;

		const firstUpdater = activePlayers
			.filter(
				(u) =>
					this.canUserModify(u, 'update') &&
					!u.isGM &&
					u.id !== primaryOwner.id,
			)
			.shift();

		return firstUpdater ?? null;
	}

	get preventMagicUseEffects() {
		return this.effects.filter((effect) =>
			effect.system.effects?.some((e) => e.name === 'cantUseMagic'),
		);
	}

	get weight() {
		return this.items.reduce((weight, i) => {
			if (i.system.weight) weight += Number(i.system.weight);
			return weight;
		}, 0);
	}

	get overweight() {
		return (
			this.weight > this.system.secondaryAttributes.maxEquipmentWeight.total
		);
	}

	/**
	 * Get an attribute by its slug
	 * @param {string} slug attribute slug
	 * @returns {Attribute}
	 */
	getAttribute(slug) {
		return this.system.attributes[slug];
	}

	/**
	 * Get a secondary attribute by its slug
	 * @param {string} slug attribute slug
	 * @returns {Attribute}
	 */
	getSecondaryAttribute(slug) {
		return this.system.secondaryAttributes[slug];
	}

	/* ------------------------------- */
	/*  Static methods                 */
	/* ------------------------------- */

	/** @inheritdoc */
	static async createDocuments(data, operation) {
		const sources = data.map((d) =>
			d instanceof ActorMadness ? d.toObject() : d,
		);
		sources.forEach((source) => ActorMadness._preparePrototypeToken(source));

		return super.createDocuments(sources, operation);
	}

	/**
	 * Prepare default prototype token data
	 * @param {object} source document data
	 */
	static _preparePrototypeToken(source) {
		const merged = foundry.utils.mergeObject(source, { prototypeToken: {} });
		merged.prototypeToken.actorLink = source.type === 'character';
		merged.prototypeToken.displayBars = source.type === 'character' ? 50 : 40;
		merged.prototypeToken.bar1 = {
			attribute: 'hp',
		};
		merged.prototypeToken.bar2 = {
			attribute: 'mp',
		};
	}

	/* ------------------------------- */
	/*  Checks                         */
	/* ------------------------------- */

	/**
	 * Check if actor is immuned to status effect
	 * @param {string} statusId status effect ID
	 * @returns {boolean} `true` if actor is immuned, `false` otherwise
	 */
	isImmune(statusId) {
		return this.system.immunities.includes(statusId);
	}

	/* ------------------------------- */
	/*  Data preparation               */
	/* ------------------------------- */

	/** @inheritdoc */
	prepareData() {
		console.log(`Madness system | Actor | ${this.name} | Preparing data...`);
		super.prepareData();
		if (game.user === this.firstUpdater) {
			this.checkWeight();
		}
		game.madness.effectsTracker.refresh();
		console.log(`Madness system | Actor | ${this.name} | Data prepared ✅`);
	}

	/** @inheritdoc */
	prepareBaseData() {
		console.log(
			`Madness system | Actor | ${this.name} | Preparing base data...`,
		);
		super.prepareBaseData();

		this._initEthnicity();
		this._initSecondaryAttributes();
		this._initSecondaryMagics();
		this._initArmor();
		this._initImmunities();
		this._initPassives();

		console.log(
			`Madness system | Actor | ${this.name} | Base data prepared ✅`,
		);
	}

	/**
	 * Initialize armor
	 */
	_initArmor() {
		this.system.armor = {};
	}

	/**
	 * Initialize ethnicity and its attributes values
	 */
	_initEthnicity() {
		this.ethnicity = null;

		const attributes = this.system.attributes;
		Object.entries(attributes).forEach(([key, value]) => {
			value.ethnicity = 0;
		});
	}

	/**
	 * Initialize immunities
	 */
	_initImmunities() {
		this.system.immunities = [];
	}

	/**
	 * Initialize passives
	 */
	_initPassives() {
		const attr = {
			attributes: Object.keys(this.system.attributes),
			secondaryAttributes: Object.keys(CONFIG.Madness.formulas.attributes),
			magics: Object.keys(CONFIG.Madness.magics),
			secondaryMagics: Object.keys(CONFIG.Madness.formulas.magics),
		};
		Object.entries(attr).forEach(([key, value]) => {
			value.forEach((v) => {
				if (this.system[key][v]) {
					this.system[key][v].passives = 0;
				}
			});
		});
	}

	/**
	 * Initialize secondary attributes
	 */
	_initSecondaryAttributes() {
		this.system.secondaryAttributes = {};
		Object.keys(CONFIG.Madness.formulas.attributes).forEach(
			(key) => (this.system.secondaryAttributes[key] = {}),
		);
	}

	/**
	 * Initialize secondary magics
	 */
	_initSecondaryMagics() {
		this.system.secondaryMagics = {};
		Object.keys(CONFIG.Madness.formulas.magics).forEach(
			(key) => (this.system.secondaryMagics[key] = {}),
		);
	}

	/** @inheritdoc */
	prepareDerivedData() {
		console.log(
			`Madness system | Actor | ${this.name} | Preparing derived data...`,
		);
		super.prepareDerivedData();

		this._prepareAttributes();
		this._prepareMagics();
		this._prepareArmor();
		this._prepareWeight();
		this._prepareImmunities();

		console.log(
			`Madness system | Actor | ${this.name} | Derived data prepared ✅`,
		);
	}

	/**
	 * Prepare armor derived data: modifiers and total
	 */
	_prepareArmor() {
		const armorModifiers = [
			this._generateModifier(
				this.equipments.reduce(
					(armor, e) => (armor += Number(e.system.armor)),
					0,
				),
				'Armor',
				'equipments',
			),
			this._generateModifier(
				this.weapons.reduce(
					(armor, w) =>
						(armor += Number(w.getPassiveModifier('increaseArmor'))),
					0,
				),
				'Armor',
				'weapons',
			),
		];

		const armor = this.system.armor;
		ActorMadness.MODIFIERS_SOURCES.forEach((type) => {
			if (armor[type]) {
				armorModifiers.push(this._generateArmorModifier(type));
			}
		});

		Object.values(this.system.passives).forEach((p) => {
			if (!p.active) return;

			if (p.passive === 'armor') {
				armorModifiers.push(
					this._generateModifier(
						p.strength,
						capitalizeFirstLetter(p.passive),
						'personalPassives',
					),
				);
			}
		});

		const armorStat = foundry.utils.mergeObject(
			new Attribute(this, {
				label: 'armor',
				modifiers: armorModifiers,
			}),
			{ overwrite: false },
		);
		armorStat.total = Math.max(0, armorStat.totalModifier);
		this.system.armor = armorStat;
	}

	/**
	 * Prepare attributes derived data: modifiers, HP, MP and secondary attributes
	 */
	_prepareAttributes() {
		this._prepareAttributesModifiers();
		this._prepareHP();
		this._prepareMP();
		this._prepareSecondaryAttributes();
	}

	/**
	 * Prepare attributes modifiers and totals
	 */
	_prepareAttributesModifiers() {
		Object.entries(this.system.attributes).forEach(([key, value]) => {
			const modifiers = [];
			ActorMadness.MODIFIERS_SOURCES.forEach((type) => {
				if (value[type]) {
					modifiers.push(this._generateAttributeModifier(key, type));
				}
			});

			Object.values(this.system.passives).forEach((p) => {
				if (!p.active) return;

				if (p.passive === key) {
					modifiers.push(
						this._generateModifier(
							p.strength,
							capitalizeFirstLetter(p.passive),
							'personalPassives',
						),
					);
				}
			});

			const stat = foundry.utils.mergeObject(
				new Attribute(this, { label: key, modifiers: modifiers }),
				value,
				{ overwrite: false },
			);
			stat.total = Math.max(0, stat.totalModifier + stat.value);
			this.system.attributes[key] = stat;
		});
	}

	/**
	 * Prepare HP
	 */
	_prepareHP() {
		const hitPoints = this.system.hp;
		const hpModifiers = [];
		ActorMadness.MODIFIERS_SOURCES.forEach((type) => {
			if (hitPoints[type]) {
				hpModifiers.push(this._generateHPModifier(type));
			}
		});

		Object.values(this.system.passives).forEach((p) => {
			if (!p.active) return;

			if (p.passive === 'hp') {
				hpModifiers.push(
					this._generateModifier(
						p.strength,
						p.passive.toUpperCase(),
						'personalPassives',
					),
				);
			}
		});

		const hpStat = foundry.utils.mergeObject(
			new Attribute(this, { label: 'hp', modifiers: hpModifiers }),
			hitPoints,
			{ overwrite: false },
		);
		const baseHP =
			(this.ethnicity?.system.hp ?? 30) + (hpStat.totalModifier ?? 0);
		hpStat.max = Math.max(
			0,
			new Formula(CONFIG.Madness.formulas.hp).evaluate({
				...this.attributesTotals,
				base: baseHP,
			})?.evaluated,
		);
		if (game.user === this.firstUpdater) {
			if (hpStat.value > hpStat.max) {
				this.update({ 'system.hp.value': hpStat.max });
			}
		}
		hpStat.value = Math.min(hpStat.value, hpStat.max);
		this.system.hp = hpStat;
	}

	/**
	 * Prepare immunities
	 */
	_prepareImmunities() {
		const statusEffects = Object.keys(CONFIG.Madness.statusEffects);
		Object.values(this.system.passives).forEach((p) => {
			if (!p.active) return;

			if (statusEffects.includes(p.passive)) {
				this.system.immunities.push(p.passive);
			}
		});
	}

	/**
	 * Prepare magics derived data: modifiers and secondary magics
	 */
	_prepareMagics() {
		this._prepareMagicsModifiers();
		this._prepareSecondaryMagics();
	}

	/**
	 * Prepare magics modifiers and totals
	 */
	_prepareMagicsModifiers() {
		Object.entries(this.system.magics).forEach(([key, value]) => {
			const modifiers = [];
			ActorMadness.MODIFIERS_SOURCES.forEach((type) => {
				if (value[type]) {
					modifiers.push(this._generateMagicModifier(key, type));
				}
			});

			Object.values(this.system.passives).forEach((p) => {
				if (!p.active) return;

				if (p.passive === key) {
					modifiers.push(
						this._generateModifier(
							p.strength,
							capitalizeFirstLetter(p.passive),
							'personalPassives',
						),
					);
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
			stat.total = Math.max(stat.totalModifier + stat.value, 0);
			this.system.magics[key] = stat;
		});
	}

	/**
	 * Prepare MP
	 */
	_prepareMP() {
		const manaPoints = this.system.mp;
		const mpModifiers = [];
		ActorMadness.MODIFIERS_SOURCES.forEach((type) => {
			if (manaPoints[type]) {
				mpModifiers.push(this._generateMPModifier(type));
			}
		});

		Object.values(this.system.passives).forEach((p) => {
			if (!p.active) return;

			if (p.passive === 'mp') {
				mpModifiers.push(
					this._generateModifier(
						p.strength,
						p.passive.toUpperCase(),
						'personalPassives',
					),
				);
			}
		});

		const mpStat = foundry.utils.mergeObject(
			new Attribute(this, { label: 'mp', modifiers: mpModifiers }),
			manaPoints,
			{ overwrite: false },
		);
		const baseMP =
			(this.ethnicity?.system.mp ?? 15) + (mpStat.totalModifier ?? 0);
		mpStat.max = Math.max(
			0,
			new Formula(CONFIG.Madness.formulas.mp).evaluate({
				...this.attributesTotals,
				base: baseMP,
			})?.evaluated,
		);
		if (game.user === this.firstUpdater) {
			if (mpStat.value > mpStat.max) {
				this.update({ 'system.mp.value': mpStat.max });
			}
		}
		mpStat.value = Math.min(mpStat.value, mpStat.max);
		this.system.mp = mpStat;
	}

	/**
	 * Prepare secondary attributes: modifiers and totals
	 */
	_prepareSecondaryAttributes() {
		Object.entries(CONFIG.Madness.formulas.attributes).forEach(
			([key, value]) => {
				const modifiers = [];
				ActorMadness.MODIFIERS_SOURCES.forEach((type) => {
					if (this.system.secondaryAttributes[key]?.[type]) {
						modifiers.push(this._generateSecondaryAttributeModifier(key, type));
					}
				});

				Object.values(this.system.passives).forEach((p) => {
					if (!p.active) return;

					if (p.passive === key) {
						modifiers.push(
							this._generateModifier(
								p.strength,
								capitalizeFirstLetter(p.passive),
								'personalPassives',
							),
						);
					}
				});

				const stat = foundry.utils.mergeObject(
					new Attribute(this, { label: key, modifiers: modifiers }),
					{
						value: new Formula(value).evaluate(this.attributesTotals)
							?.evaluated,
					},
					{ overwrite: false },
				);
				stat.total = Math.max(0, stat.totalModifier + stat.value);
				this.system.secondaryAttributes[key] = stat;
			},
		);

		const rollableSecondaryAttributes = ['critRate', 'dodgeRate', 'initiative'];
		rollableSecondaryAttributes.forEach(
			(attr) => (this.system.secondaryAttributes[attr].rollable = true),
		);
	}

	/**
	 * Prepare secondary magics: modifiers and totals
	 */
	_prepareSecondaryMagics() {
		Object.entries(CONFIG.Madness.formulas.magics).forEach(([key, value]) => {
			const modifiers = [];
			ActorMadness.MODIFIERS_SOURCES.forEach((type) => {
				if (this.system.secondaryMagics[key]?.[type]) {
					modifiers.push(this._generateSecondaryMagicModifier(key, type));
				}
			});

			Object.values(this.system.passives).forEach((p) => {
				if (!p.active) return;

				if (p.passive === key) {
					modifiers.push(
						this._generateModifier(
							p.strength,
							capitalizeFirstLetter(p.passive),
							'personalPassives',
						),
					);
				}
			});

			const stat = foundry.utils.mergeObject(
				new Attribute(this, {
					type: 'magics',
					label: key,
					modifiers: modifiers,
				}),
				{ value: new Formula(value).evaluate(this.magicsTotals)?.evaluated },
				{ overwrite: false },
			);
			stat.total = Math.max(0, stat.totalModifier + stat.value);
			this.system.secondaryMagics[key] = stat;
		});
	}

	/**
	 * Prepare weight
	 */
	_prepareWeight() {
		const equipments = this.items.filter(
			(i) => i.type === 'equipment' || i.type === 'weapon',
		);
		this.system.currentEquipmentWeight = equipments.reduce(
			(weight, e) => (weight += Number(e.system.weight)),
			0,
		);
	}

	/** @inheritdoc */
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

	/**
	 * Prepare data from items
	 */
	prepareDataFromItems() {
		console.log(
			`Madness system | Actor | ${this.name} | Preparing data from items...`,
		);
		this._prepareDataFrom(this.items);
		console.log(
			`Madness system | Actor | ${this.name} | Data from items prepared ✅`,
		);
	}

	/**
	 * Prepare data from effects
	 */
	prepareDataFromEffects() {
		console.log(
			`Madness system | Actor | ${this.name} | Preparing data from effects...`,
		);
		this._prepareDataFrom(this.effects);
		console.log(
			`Madness system | Actor | ${this.name} | Data from effects prepared ✅`,
		);
	}

	_prepareDataFrom(document) {
		for (const d of document) {
			d.prepareActorData?.();
		}
	}

	_generateAttributeModifier(key, type) {
		const mod = this.system.attributes[key][type];
		return this._generateModifier(mod, capitalizeFirstLetter(key), type);
	}

	_generateHPModifier(type) {
		const mod = this.system.hp[type];
		return this._generateModifier(mod, 'HP', type);
	}

	_generateSecondaryAttributeModifier(key, type) {
		const mod = this.system.secondaryAttributes[key][type];
		return this._generateModifier(mod, key, type);
	}

	_generateMagicModifier(key, type) {
		const mod = this.system.magics[key][type];
		return this._generateModifier(mod, capitalizeFirstLetter(key), type);
	}

	_generateSecondaryMagicModifier(key, type) {
		const mod = this.system.secondaryMagics[key][type];
		return this._generateModifier(mod, capitalizeFirstLetter(key), type);
	}

	_generateMPModifier(type) {
		const mod = this.system.mp[type];
		return this._generateModifier(mod, 'MP', type);
	}

	_generateArmorModifier(type) {
		const mod = this.system.armor[type];
		return this._generateModifier(mod, 'Armor', type);
	}

	_generateModifier(mod, key, type) {
		return new ModifierMadness(
			`Madness.${capitalizeFirstLetter(type)}${key}`,
			capitalizeFirstLetter(type),
			mod,
		);
	}

	/* ------------------------------- */
	/*  Methods                        */
	/* ------------------------------- */

	/**
	 * Update actor attributes
	 * @param {object} attributes attributes to update, attribute's slug as key
	 */
	updateAttributes(attributes) {
		Object.entries(attributes).forEach(([key, value]) => {
			this.system.attributes[key].value = value;
		});
		this.update({ 'system.attributes': this.system.attributes });
	}

	/**
	 * Update actor magics
	 * @param {object} magics magics to update, magic's slug as key
	 */
	updateMagics(magics) {
		Object.entries(magics).forEach(([key, value]) => {
			this.system.magics[key].value = value;
		});
		this.update({ 'system.magics': this.system.magics });
	}

	/**
	 * Check actor's weight, toggle status effect on if overweight, off otherwise
	 * @returns {boolean} `true` if actor isn't overweight, `false` otherwise
	 */
	async checkWeight() {
		const isOverweight = this.overweight;
		await this.toggleStatusEffect('overweight', { active: isOverweight });
		return !isOverweight;
	}

	/**
	 * Check actor's weight with new item
	 * @param {ItemMadness} item new item added to actor
	 * @returns {boolean} `true` if actor isn't overweight, `false` otherwise
	 */
	checkWeightWithNewItem(item) {
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

	/**
	 * Check actor's weapon slots
	 * @returns {boolean} `true` if remaining available slots, `false` otherwise
	 */
	checkWeaponSlots() {
		return CONFIG.Madness.default.weaponMaxSlots > this.weapons.length;
	}

	/**
	 * Add a new empty passive to actor
	 */
	createPassive() {
		const data = { name: null, passive: null, strength: null };
		const id = foundry.utils.randomID(16);
		this.system.passives[id] = data;
		this.update({ 'system.passives': this.system.passives });
	}

	/* ------------------------------- */
	/*  MP                             */
	/* ------------------------------- */

	/**
	 * Add MP
	 * @param {number} value MP value to add
	 * @returns {Promise<ActorMadness>} the updated document instance
	 */
	addMP(value = this.system.secondaryAttributes.manaRegen.total) {
		return this._updateMP(
			Math.min(this.system.mp.value + value, this.system.mp.max),
		);
	}

	/**
	 * Check if current MP are greater or equal than requested value
	 * @param {number} value MP value to check
	 * @returns {boolean} `true` if current MP are greater or equal to requested value, `false` otherwise
	 */
	checkMP(value) {
		if (isNaN(value)) throw new Error('Invalid value');
		return this.currentMP >= value;
	}

	/**
	 * Remove MP
	 * @param {number} value MP value to remove
	 * @returns {Promise<ActorMadness>} the updated document instance
	 */
	removeMP(value) {
		return this._updateMP(Math.max(0, this.system.mp.value - value));
	}

	/**
	 * Update MP value
	 * @param {number} value MP new value
	 * @returns {Promise<ActorMadness>} the updated document instance
	 */
	_updateMP(value) {
		return this.update({ 'system.mp.value': value });
	}

	/* ------------------------------- */
	/*  HP                             */
	/* ------------------------------- */

	/**
	 * Add temporary HP
	 * @param {number} value temporary HP value to add
	 */
	addTempHP(value) {
		if (!value) return;
		const hitPoints = this.hitPoints;
		if (!hitPoints) return;
		if (hitPoints.temp >= value) return;
		this.update({ 'system.hp.temp': value });
	}

	/* ------------------------------- */
	/*  Combat                         */
	/* ------------------------------- */

	applyDamage(damage = 0, context = {}) {
		const hitPoints = this.hitPoints;
		if (!hitPoints) return;
		const outcomeAfterParry = context?.parry
			? this._applyParryDamageReduction(
					damage,
					context.modifiers?.parryDamageReduction,
				)
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
			Math.max(1, outcomeAfterArmor),
			context,
		);
		if (damageResult.totalApplied !== 0) {
			this.update(damageResult.updates);
		}
		return damageResult.totalApplied;
	}

	async dodge(token, options = {}) {
		const context = {
			actor: this,
			rollType: 'dodge',
			formulaAttributes: ['dodgeRate', 'critRate', 'critFailureRate'],
			promptModifiers: options.promptModifiers,
		};
		const roll = (await CheckMadness.roll(context)).critOutcome;
		if (!roll.isCritical) {
			roll.result =
				roll.roll.total >
				100 -
					Math.min(
						this.dodgeRate.total + (context.modifiers?.dodgeRate ?? 0),
						80,
					)
					? 'success'
					: 'failure';
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

	async parry(token, options = {}) {
		const context = {
			actor: this,
			rollType: 'parry',
			formulaAttributes: [
				'parryDamageReduction',
				'critRate',
				'critFailureRate',
			],
			promptModifiers: options.promptModifiers,
		};
		const roll = (await CheckMadness.roll(context)).critOutcome;
		if (context.modifiers) roll.modifiers = context.modifiers;
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
					(effect.system.effects?.reduce((total, e) => {
						const stacks = effect.system.stacks ?? 1;
						const value = e.value * stacks;
						return e.type === 'damage' &&
							e.applicationType === 'health' &&
							e.bypassTempHP
							? total + value
							: total;
					}, 0) ?? 0)
				);
			}, 0);
		}

		const toApply = appliedToHP + additionalDamage;
		updates['system.hp.value'] = Math.clamp(hp.value - toApply, 0, hp.max);

		const totalApplied = appliedToTemp + toApply;

		return { updates, totalApplied };
	}

	_applyParryDamageReduction(damage, modifier = 0) {
		const parryDamageReduction = Math.min(
			this.parryDamageReduction.total + modifier ?? 0,
			80,
		);
		return Math.ceil(((100 - parryDamageReduction) * damage) / 100);
	}

	_applyArmorDamageReduction(damage, incomingPassives = []) {
		if (incomingPassives.some((p) => p.name === 'ignoreArmor')) {
			return damage;
		}
		return Math.max(0, damage - this.system.armor.total);
	}

	/* ------------------------------- */
	/*  Status effects                 */
	/* ------------------------------- */

	/**
	 * If stackable, decrease stacks of a status effect and toggle off if not stackable or stacks equals 0
	 * @param {string} statusId status effect ID
	 * @returns {Promise<ActiveEffectMadness|boolean|undefined>} updated `ActiveEffectMadness` document instances, `boolean`s and/or `undefined`s.
	 * @see Actor#toggleStatusEffect for return values
	 */
	async decreaseStatusEffect(statusId) {
		const existing = this.effects.find((e) => e.system.slug === statusId);
		if (!existing) {
			throw new Error(
				`Active effect ${statusId} not found on actor ${this.name}`,
			);
		}

		if (existing.system.stackable) {
			await existing.decreaseStacks(1);
			game.madness.effectsTracker.refresh();
		}
		return existing.system.stacks
			? existing
			: this.toggleStatusEffect(statusId);
	}

	/**
	 * Toggle on and, if stackable, increase stacks of a status effect
	 * @param {string} statusId status effect ID
	 * @returns {Promise<ActiveEffectMadness|boolean|undefined>} updated `ActiveEffectMadness` document instances, `boolean`s and/or `undefined`s. `undefined` if actor is immune
	 * @see Actor#toggleStatusEffect for return values
	 */
	async increaseStatusEffect(statusId) {
		if (this.isImmune(statusId)) {
			this.displayImmuneMessage(statusId);
			return;
		}
		let existing = this.effects.find((e) => e.system.slug === statusId);
		if (!existing) {
			existing = await this.toggleStatusEffect(statusId);
		}
		if (existing.system.stackable) {
			await existing.increaseStacks(1);
			game.madness.effectsTracker.refresh();
		}
		return existing;
	}

	/**
	 * Toggle several status effects at once
	 * @param {Array<string>} statusIds status effect IDs
	 * @returns {Promise<Array<ActiveEffectMadness|boolean|undefined>>} array of updated `ActiveEffectMadness` document instances, `boolean`s and/or `undefined`s
	 * @see Actor#toggleStatusEffect for return values
	 */
	toggleStatusEffects(statusIds) {
		return Promise.all(
			statusIds.map((statusId) => this.toggleStatusEffect(statusId)),
		);
	}

	/**
	 * @see Actor#toggleStatusEffect
	 */
	async toggleStatusEffect(statusId, options = {}) {
		const effect = await super.toggleStatusEffect(statusId, options);
		game.madness.effectsTracker.refresh();
		return effect;
	}

	/**
	 * Decrease duration for several status effects
	 * @param {Array<string>} statusIds status effect IDs for which reduce duration
	 * @param {Function} durationFilterCallback callback to filter which duration to decrease
	 * @returns {Promise<Array<ActiveEffectMadness|boolean|undefined>>} array of updated `ActiveEffectMadness` document instances, `boolean`s and/or `undefined`s
	 * @see ActorMadness#_decreaseStatusEffectDuration for return values
	 */
	decreaseStatusEffectsDuration(statusIds, durationFilterCallback) {
		return Promise.all(
			statusIds.map((statusId) =>
				this._decreaseStatusEffectDuration(statusId, durationFilterCallback),
			),
		);
	}

	/**
	 * Decrease status effect duration
	 * @param {string} statusId status effect ID for which reduce duration
	 * @param {Function} durationFilterCallback callback to filter which duration to decrease
	 * @returns {Promise<ActiveEffectMadness|boolean|undefined>} A promise which resolves to one of the following values:
	 * - `ActiveEffectMadness` if a new effect need to be created
	 * - `true` if was already an existing effect
	 * - `false` if an existing effect needed to be removed
	 * - `undefined` if no changes need to be made
	 */
	async _decreaseStatusEffectDuration(statusId, durationFilterCallback) {
		const existing = this.effects.find((e) => e.system.slug === statusId);
		if (!existing) {
			throw new Error(
				`Active effect ${statusId} not found on actor ${this.name}`,
			);
		}
		if (existing.durations.find(durationFilterCallback)?.value <= 1) {
			return this.toggleStatusEffect(statusId);
		}
		return existing.decreaseDuration(durationFilterCallback);
	}

	/**
	 * Display a notification warning the actor is immune to status effect
	 * @param {string} statusId status effect ID actor is immune to
	 */
	displayImmuneMessage(statusId) {
		const immunizedMessage = game.i18n.format(
			'Madness.Message.Warning.ActorImmuneToStatus',
			{
				actor: this.name,
				statusLabel: game.i18n.localize(
					`Madness.StatusEffect.${capitalizeFirstLetter(statusId)}`,
				),
			},
		);
		ui.notifications.warn(immunizedMessage);
	}
}
