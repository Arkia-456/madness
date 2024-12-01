import {
	EffectMadness,
	EquipmentMadness,
	EthnicityMadness,
	ItemMadness,
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
		critFailureRate: 'Madness.Attributes.CriticalFailureRate',
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
		minimumDamage: 1,
		rollFormula: '1d100',
		weaponMaxSlots: 3,
	},
	equipment: {
		slots: {
			head: 'Madness.Equipment.Slots.Head',
			body: 'Madness.Equipment.Slots.Body',
			legs: 'Madness.Equipment.Slots.Legs',
		},
	},
	effect: {
		derion: {
			effects: [
				{
					name: 'increaseDamage',
					formula: '@{mod}',
				},
			],
		},
		explosion: {
			effects: [
				{
					name: 'preventDodge',
				},
			],
		},
		guardBreak: {
			effects: [
				{
					name: 'preventParry',
				},
			],
		},
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
			'consumable-weapon': WeaponMadness,
			equipment: EquipmentMadness,
			ethnicity: EthnicityMadness,
			effect: EffectMadness,
			generic: ItemMadness,
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
		hp: '@{base} + 6 * @{con}',
		magics: {
			doka: 'Math.min(@{ome}, @{teruuk})',
			natah: 'Math.min(@{erah}, @{shor}, @{sith}, @{ome}, @{teruuk})',
		},
		mp: '@{base} + 3 * @{int}',
		rolls: {
			critRate: '1d100',
			dodgeRate: '1d100',
			initiative: '1d10 + @value',
		},
		scores: {
			get criticalFailure() {
				return `${MadnessConfig.default.criticalFailureRate} + @{mod}`;
			},
			critical: '100 - (@{actorCritRate} + @{mod}) + 1',
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
		derion: {
			label: 'Madness.Magics.Derion',
			description: 'Madness.Magics.DerionDescription',
		},
		doka: {
			label: 'Madness.Magics.Doka',
			description: 'Madness.Magics.DokaDescription',
		},
		erah: {
			label: 'Madness.Magics.Erah',
			description: 'Madness.Magics.ErahDescription',
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
		escura: {
			label: 'Madness.Magics.Escura',
			description: 'Madness.Magics.EscuraDescription',
		},
		natah: {
			label: 'Madness.Magics.Natah',
			description: 'Madness.Magics.NatahDescription',
		},
		ome: {
			label: 'Madness.Magics.Ome',
			description: 'Madness.Magics.OmeDescription',
			effects: [
				{
					name: 'decreaseMPCost',
					formula: '(Math.ceil(@{ome}/2)*2)/@{nbMagics}',
				},
			],
		},
		shor: {
			label: 'Madness.Magics.Shor',
			description: 'Madness.Magics.ShorDescription',
			effects: [
				{
					name: 'addTempHP',
					type: 'buff',
					formula: '(Math.ceil(@{shor}/2)*4)/@{nbMagics}',
				},
			],
		},
		sith: {
			label: 'Madness.Magics.Sith',
			description: 'Madness.Magics.SithDescription',
			effects: [
				{
					name: 'increaseCritRate',
					formula: '(Math.ceil(@{sith}/2)*4)/@{nbMagics}',
				},
			],
		},
		teruuk: {
			label: 'Madness.Magics.Teruuk',
			description: 'Madness.Magics.TeruukDescription',
			effects: [
				{
					name: 'increaseRange',
					formula: '(Math.ceil(@{teruuk}/2)*4)/@{nbMagics}',
				},
			],
		},
	},
	modules: {
		heavy: {
			label: 'Madness.Modules.Heavy',
			description: 'Madness.Modules.HeavyDescription',
			effects: [
				{
					name: 'increaseDamage',
					formula: '(@{heavy}*4)/@{nbModules}',
				},
			],
		},
		accurate: {
			label: 'Madness.Modules.Accurate',
			description: 'Madness.Modules.AccurateDescription',
			effects: [
				{
					name: 'increaseCritRate',
					formula: '(@{accurate}*4)/@{nbModules}',
				},
			],
		},
		overload: {
			label: 'Madness.Modules.Overload',
			description: 'Madness.Modules.OverloadDescription',
			effects: [
				{
					name: 'increaseDamageWithMPCost',
					formula: '(@{overload}*6)/@{nbModules}',
					cost: 2,
				},
			],
		},
		ammo: {
			label: 'Madness.Modules.Ammo',
			description: 'Madness.Modules.AmmoDescription',
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
			description: 'Madness.Modules.CrystaltechDescription',
			effects: [
				{
					name: 'increaseRange',
					formula: '(@{crystaltech}*4)/@{nbModules}',
				},
			],
		},
		melee: {
			label: 'Madness.Modules.Melee',
			description: 'Madness.Modules.MeleeDescription',
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
			description: 'Madness.Modules.ShieldDescription',
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
		bleed: {
			description: 'Madness.StatusEffect.Description.Bleed',
			effects: [
				{
					type: 'add',
					applicationTime: 'end',
					applicationType: 'turn',
					bypassTempHP: true,
					target: 'hp',
					value: -2,
				},
			],
			name: 'Madness.StatusEffect.Bleed',
			stackable: true,
		},
		blind: {
			description: 'Madness.StatusEffect.Description.Blind',
			durations: [
				{
					type: 'turn',
					valueOrigin: 'stack',
					applicationTime: 'end',
				},
			],
			name: 'EFFECT.StatusBlind',
			stackable: true,
		},
		burn: {
			description: 'Madness.StatusEffect.Description.Burn',
			effects: [
				{
					type: 'damage',
					applicationType: 'health',
					bypassTempHP: true,
					value: 2,
				},
			],
			name: 'Madness.StatusEffect.Burn',
			stackable: true,
		},
		burrow: {
			description: 'Madness.StatusEffect.Description.Burrow',
			name: 'EFFECT.StatusBurrow',
		},
		confusion: {
			description: 'Madness.StatusEffect.Description.Confusion',
			effects: [
				{
					type: 'statModifier',
					target: 'critFailureRate',
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
			name: 'Madness.StatusEffect.Confusion',
		},
		cover: {
			description: 'Madness.StatusEffect.Description.Cover',
			durations: [
				{
					type: 'action',
					actionOrigin: 'other',
					value: 1,
				},
			],
			effects: [
				{
					type: 'statModifier',
					target: 'dodgeRate',
					value: 20,
				},
			],
			name: 'Madness.StatusEffect.Cover',
		},
		dead: {
			description: 'Madness.StatusEffect.Description.Dead',
			name: 'Madness.StatusEffect.Dead',
		},
		down: {
			description: 'Madness.StatusEffect.Description.Down',
			effects: [
				{
					type: 'prevent',
					target: 'dodge',
				},
			],
			name: 'Madness.StatusEffect.Down',
		},
		fly: {
			description: 'Madness.StatusEffect.Description.Fly',
			name: 'EFFECT.StatusFlying',
		},
		freeze: {
			description: 'Madness.StatusEffect.Description.Freeze',
			effects: [
				{
					type: 'statModifier',
					target: 'maxMoveDistance',
					value: -2,
				},
			],
			name: 'Madness.StatusEffect.Freeze',
			stackable: true,
		},
		invisible: {
			description: 'Madness.StatusEffect.Description.Invisible',
			name: 'EFFECT.StatusInvisible',
		},
		overweight: {
			description: 'Madness.StatusEffect.Description.Overweight',
			name: 'Madness.StatusEffect.Overweight',
		},
		poison: {
			description: 'Madness.StatusEffect.Description.Poison',
			effects: [
				{
					type: 'statModifier',
					target: 'primary',
					value: -1,
				},
			],
			name: 'Madness.StatusEffect.Poison',
			stackable: true,
		},
		regenHP: {
			description: 'Madness.StatusEffect.Description.RegenHP',
			name: 'Madness.StatusEffect.RegenHP',
			effects: [
				{
					type: 'add',
					applicationTime: 'end',
					applicationType: 'turn',
					bypassTempHP: true,
					target: 'hp',
					value: 2,
				},
			],
			stackable: true,
			target: 'self',
		},
		regenMP: {
			description: 'Madness.StatusEffect.Description.RegenMP',
			name: 'Madness.StatusEffect.RegenMP',
			effects: [
				{
					type: 'add',
					applicationTime: 'end',
					applicationType: 'turn',
					target: 'mp',
					value: 2,
				},
			],
			stackable: true,
			target: 'self',
		},
		shock: {
			description: 'Madness.StatusEffect.Description.Shock',
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
			name: 'Madness.StatusEffect.Shock',
		},
		stun: {
			description: 'Madness.StatusEffect.Description.Stun',
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
					type: 'prevent',
					target: 'dodge',
				},
				{
					type: 'prevent',
					target: 'parry',
				},
			],
			name: 'Madness.StatusEffect.Stun',
		},
		void: {
			description: 'Madness.StatusEffect.Description.Void',
			name: 'Madness.StatusEffect.Void',
			target: 'self',
		},
	},
};
