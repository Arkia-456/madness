import {
	EffectMadness,
	EquipmentMadness,
	EthnicityMadness,
	SpellMadness,
	WeaponMadness,
} from '../../module/item/index.js';

export const MadnessConfig = {
	Attributes: {
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
	Default: {
		CriticalFailureRate: 5,
		RollFormula: '1d100',
	},
	Equipment: {
		Slots: {
			head: 'Madness.Equipment.Slots.Head',
			body: 'Madness.Equipment.Slots.Body',
			legs: 'Madness.Equipment.Slots.Legs',
		},
	},
	Effect: {
		Transperçant: {
			Effects: [
				{
					name: 'ignoreArmor',
				},
			],
		},
		Bouclier: {
			Effects: [
				{
					name: 'addTempHP',
					type: 'buff',
					formula: '@{mod}',
				},
			],
		},
		Destruction: {
			Effects: [
				{
					name: 'removeTempHP',
				},
				{
					name: 'increaseCritRate',
					formula: '20',
				},
			],
		},
	},
	Item: {
		documentClasses: {
			equipment: EquipmentMadness,
			ethnicity: EthnicityMadness,
			effect: EffectMadness,
			spell: SpellMadness,
			weapon: WeaponMadness,
		},
	},
	Formulas: {
		Attributes: {
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
		HP: '30 + 6 * @{con}',
		Magics: {
			doka: 'Math.min(@{ome}, @{teruuk})',
			natah: 'Math.min(@{erah}, @{shor}, @{sith}, @{ome}, @{teruuk})',
		},
		MP: '15 + 3 * @{int}',
		Rolls: {
			critRate: '1d100',
			dodgeRate: '1d100',
			initiative: '1d10 + @value',
		},
		Scores: {
			get criticalFailure() {
				return `${MadnessConfig.Default.CriticalFailureRate} + @{mod}`;
			},
			critical: '100 - (@{actorCritRate} + @{mod})',
		},
	},
	Magic: {
		Erah: {
			Label: 'Madness.Magics.Erah',
			Effects: [
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
		Ome: {
			Label: 'Madness.Magics.Ome',
			Effects: [
				{
					name: 'decreaseMPCost',
					formula: '(Math.ceil(@{ome}/2)*2)/@{nbMagics}',
				},
			],
		},
		Shor: {
			Label: 'Madness.Magics.Shor',
			Effects: [
				{
					name: 'addTempHP',
					type: 'buff',
					formula: '(Math.ceil(@{shor}/2)*4)/@{nbMagics}',
				},
			],
		},
		Sith: {
			Label: 'Madness.Magics.Sith',
			Effects: [
				{
					name: 'increaseCritRate',
					formula: '(Math.ceil(@{sith}/2)*4)/@{nbMagics}',
				},
			],
		},
	},
	Magics: {
		doka: 'Madness.Magics.Doka',
		erah: 'Madness.Magics.Erah',
		natah: 'Madness.Magics.Natah',
		ome: 'Madness.Magics.Ome',
		shor: 'Madness.Magics.Shor',
		sith: 'Madness.Magics.Sith',
		teruuk: 'Madness.Magics.Teruuk',
	},
	Modules: {
		heavy: 'Madness.Modules.Heavy',
		accurate: 'Madness.Modules.Accurate',
		overload: 'Madness.Modules.Overload',
		ammo: 'Madness.Modules.Ammo',
		crystaltech: 'Madness.Modules.Crystaltech',
		melee: 'Madness.Modules.Melee',
		shield: 'Madness.Modules.Shield',
	},
	PrimaryAttributes: ['agi', 'con', 'dex', 'int', 'str'],
	StatusEffects: {
		StackableEffects: ['bleed', 'burn', 'freeze', 'poison'],
		List: {
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
		Bleed: {
			Effects: [
				{
					name: 'dot',
					applicationTime: 'end',
					applicationType: 'turn',
					bypassTempHP: true,
					value: 2,
				},
			],
		},
		Burn: {
			Effects: [
				{
					name: 'increaseDamageToHealth',
					value: 2,
				},
			],
		},
		Confusion: {
			Effects: [
				{
					name: 'increaseCriticalFailureRate',
					value: 20,
				},
			],
			Durations: [
				{
					type: 'turn',
					value: 1,
					applicationTime: 'end',
				},
			],
		},
		Down: {
			Effects: [
				{
					name: 'preventDodge',
				},
			],
		},
		Poison: {
			Effects: [
				{
					name: 'increasePrimaryAttribute',
					value: -1,
				},
			],
		},
		Shock: {
			Effects: [
				{
					name: 'cantUseMagic',
				},
			],
			Durations: [
				{
					type: 'turn',
					value: 1,
					applicationTime: 'end',
				},
			],
		},
		Stun: {
			Durations: [
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
			Effects: [
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
