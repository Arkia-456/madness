import { EthnicityMadness } from '../../module/item/index.js';

export const MadnessConfig = {
	Item: {
		documentClasses: {
			ethnicity: EthnicityMadness,
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
};
