import {
	EffectMadness,
	EthnicityMadness,
	SpellMadness,
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
	Item: {
		documentClasses: {
			ethnicity: EthnicityMadness,
			effect: EffectMadness,
			spell: SpellMadness,
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
};
