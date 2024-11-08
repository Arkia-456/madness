import {
	EffectMadness,
	EquipmentMadness,
	EthnicityMadness,
	SpellMadness,
	WeaponMadness,
} from '../../module/item/index.js';

export const MadnessConfig = {
	attributes: {
		agi: 'Madness.Attributes.Agility',
		con: 'Madness.Attributes.Constitution',
		dex: 'Madness.Attributes.Dexterity',
		int: 'Madness.Attributes.Intelligence',
		str: 'Madness.Attributes.Strength',
		hp: 'Madness.Attributes.HitPoints',
		mp: 'Madness.Attributes.ManaPoints',
		critRate: 'Madness.Attributes.CriticalRate',
		dodgeRate: 'Madness.Attributes.DodgeRate',
		initiative: 'Madness.Attributes.Initiative',
		inventoryMaxSlots: 'Madness.Attributes.InventoryMaxSlots',
		manaRegen: 'Madness.Attributes.ManaRegeneration',
		maxEquipmentWeight: 'Madness.Attributes.MaxEquipmentWeight',
		maxMoveDistance: 'Madness.Attributes.MaxMoveDistance',
		maxWeight: 'Madness.Attributes.MaxWeight',
		parryDamageReduction: 'Madness.Attributes.ParryDamageReduction',
	},
	default: {
		criticalFailureRate: 5,
		rollFormula: '1d100',
	},
	equipment: {
		slots: {
			head: 'Madness.Equipment.Slots.Head',
			body: 'Madness.Equipment.Slots.Body',
			legs: 'Madness.Equipment.Slots.Legs',
		},
	},
	effect: {
		piercing: {
			effects: [
				{
					name: 'ignoreArmor',
				},
			],
		},
		barrier: {
			effects: [
				{
					name: 'addTempHP',
					type: 'buff',
					formula: '@{mod}',
				},
			],
		},
		destruction: {
			effects: [
				{
					name: 'removeTempHP',
				},
				{
					name: 'increaseCritRate',
					formula: '20',
				},
			],
		},
		recover: {
			effects: [
				{
					name: 'removeStatusEffects',
				},
			],
		},
	},
	item: {
		documentClasses: {
			equipment: EquipmentMadness,
			ethnicity: EthnicityMadness,
			effect: EffectMadness,
			spell: SpellMadness,
			weapon: WeaponMadness,
		},
	},
	formulas: {
		attributes: {
			critRate: '5 + @{dex}',
			dodgeRate: '50 + 2 * @{agi}',
			initiative: '@{agi}',
			inventoryMaxSlots: '@{str}',
			manaRegen: '5 + @{int}',
			maxEquipmentWeight: '3 * @{str}',
			maxMoveDistance: '3 + @{agi}',
			maxWeight: '20 * @{str}',
			parryDamageReduction: '50 + 2 * @{con}',
		},
		hp: '30 + 6 * @{con}',
		magics: {
			doka: 'Math.min(@{ome}, @{teruuk})',
			natah: 'Math.min(@{erah}, @{shor}, @{sith}, @{ome}, @{teruuk})',
		},
		mp: '15 + 3 * @{int}',
		rolls: {
			critRate: '1d100',
			dodgeRate: '1d100',
			initiative: '1d10 + @value',
		},
		scores: {
			get criticalFailure() {
				return `${MadnessConfig.default.criticalFailureRate} + @{mod}`;
			},
			critical: '100 - (@{actorCritRate} + @{mod})',
		},
	},
	magic: {
		erah: {
			effects: [
				{
					name: 'increaseCritFailureRate',
					formula: '(Math.ceil(@{erah}/2)*2)/@{nbMagics}',
				},
				{
					name: 'increaseDamage',
					formula: '(Math.ceil(@{erah}/2)*8)/@{nbMagics}',
				},
			],
		},
		ome: {
			effects: [
				{
					name: 'decreaseMPCost',
					formula: '(Math.ceil(@{ome}/2)*2)/@{nbMagics}',
				},
			],
		},
		shor: {
			effects: [
				{
					name: 'addTempHP',
					type: 'buff',
					formula: '(Math.ceil(@{shor}/2)*4)/@{nbMagics}',
				},
			],
		},
		sith: {
			effects: [
				{
					name: 'increaseCritRate',
					formula: '(Math.ceil(@{sith}/2)*4)/@{nbMagics}',
				},
			],
		},
		teruuk: {
			effects: [
				{
					name: 'increaseRange',
					formula: '(Math.ceil(@{teruuk}/2)*4)/@{nbMagics}',
				},
			],
		},
	},
	magics: {
		doka: 'Madness.Magics.Doka',
		erah: 'Madness.Magics.Erah',
		natah: 'Madness.Magics.Natah',
		ome: 'Madness.Magics.Ome',
		shor: 'Madness.Magics.Shor',
		sith: 'Madness.Magics.Sith',
		teruuk: 'Madness.Magics.Teruuk',
	},
	modules: {
		heavy: {
			label: 'Madness.Modules.Heavy',
			effects: [
				{
					name: 'increaseDamage',
					formula: '(@{heavy}*4)/@{nbModules}',
				},
			],
		},
		accurate: {
			label: 'Madness.Modules.Accurate',
			effects: [
				{
					name: 'increaseCritRate',
					formula: '(@{accurate}*5)/@{nbModules}',
				},
			],
		},
		overload: {
			label: 'Madness.Modules.Overload',
			effects: [],
		},
		ammo: {
			label: 'Madness.Modules.Ammo',
			effects: [
				{
					name: 'nonReloadable',
				},
				{
					name: 'increaseDamage',
					formula: '(@{ammo}*8)/@{nbModules}',
				},
			],
		},
		crystaltech: {
			label: 'Madness.Modules.Crystaltech',
			effects: [
				{
					name: 'increaseRange',
					formula: '(@{crystaltech}*4)/@{nbModules}',
				},
			],
		},
		melee: {
			label: 'Madness.Modules.Melee',
			effects: [
				{
					name: 'nonReloadable',
				},
				{
					name: 'noAmmo',
				},
			],
		},
		shield: {
			label: 'Madness.Modules.Shield',
			effects: [
				{
					name: 'increaseArmor',
					formula: '(@{shield}*2)/@{nbModules}',
				},
			],
		},
	},
	primaryAttributes: ['agi', 'con', 'dex', 'int', 'str'],
	statusEffects: {
		stackableEffects: ['bleed', 'burn', 'freeze', 'poison'],
		list: {
			bleed: 'Madness.StatusEffect.Bleed',
			burn: 'Madness.StatusEffect.Burn',
			confusion: 'Madness.StatusEffect.Confusion',
			down: 'Madness.StatusEffect.Down',
			freeze: 'Madness.StatusEffect.Freeze',
			poison: 'Madness.StatusEffect.Poison',
			shock: 'Madness.StatusEffect.Shock',
			stun: 'Madness.StatusEffect.Stun',
			void: 'Madness.StatusEffect.Void',
		},
		bleed: {
			effects: [
				{
					name: 'dot',
					applicationTime: 'end',
					applicationType: 'turn',
					bypassTempHP: true,
					value: 2,
				},
			],
		},
		burn: {
			effects: [
				{
					name: 'increaseDamageToHealth',
					value: 2,
				},
			],
		},
		confusion: {
			effects: [
				{
					name: 'increaseCriticalFailureRate',
					value: 20,
				},
			],
			durations: [
				{
					type: 'turn',
					value: 1,
					applicationTime: 'end',
				},
			],
		},
		down: {
			effects: [
				{
					name: 'preventDodge',
				},
			],
		},
		poison: {
			effects: [
				{
					name: 'increasePrimaryAttribute',
					value: -1,
				},
			],
		},
		shock: {
			effects: [
				{
					name: 'cantUseMagic',
				},
			],
			durations: [
				{
					type: 'turn',
					value: 1,
					applicationTime: 'end',
				},
			],
		},
		stun: {
			durations: [
				{
					type: 'action',
					actionOrigin: 'other',
					value: 1,
				},
				{
					type: 'turn',
					value: 1,
					applicationTime: 'start',
				},
			],
			effects: [
				{
					name: 'preventDodge',
				},
				{
					name: 'preventParry',
				},
			],
		},
	},
};
