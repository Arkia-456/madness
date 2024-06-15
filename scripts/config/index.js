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
	},
	Default: {
		CriticalFailureRate: 5,
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
