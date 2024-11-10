import {
	Formula,
	displayWarning,
	fontAwesomeIcon,
	uncapitalizeFirstLetter,
} from '../../utils/index.js';
import { EditAttributesPopup } from './popups/edit-attributes-popup.js';
import { EditMagicsPopup } from './popups/edit-magics-popup.js';

class ActorSheetMadness extends ActorSheet {
	static get defaultOptions() {
		const options = super.defaultOptions;
		options.classes = ['madness', 'sheet', 'character'];
		options.width = 750;
		options.height = 750;
		options.tabs = [
			{
				navSelector: 'nav.sheet-navigation',
				contentSelector: '.sheet-content',
				initial: 'character',
			},
		];
		return options;
	}

	get template() {
		return 'systems/madness/templates/actor/sheet.hbs';
	}

	async getData(options) {
		const sheetData = await super.getData(options);
		const actor = this.actor;
		sheetData.system = actor.system;
		sheetData.ethnicity = actor.ethnicity;
		const spells = actor.items.filter((i) => i.type === 'spell');
		spells.forEach((spell) => {
			spell.minDamage = spell.getMinDamage(actor.system.attributes);
			spell.maxDamage = spell.getMaxDamage(actor.system.attributes);
		});
		sheetData.spells = spells;
		const equipments = {};
		actor.items.forEach((i) => {
			equipments[i.system.slot] = i;
		});
		sheetData.equipments = equipments;
		const weapons = actor.items.filter((i) => i.type === 'weapon');
		weapons.forEach((weapon) => {
			weapon.minDamage = weapon.getMinDamage(actor.system.attributes);
			weapon.maxDamage = weapon.getMaxDamage(actor.system.attributes);
		});
		sheetData.weapons = weapons;
		return sheetData;
	}

	async _onDropItem(event, data) {
		event.preventDefault();
		const item = await Item.fromDropData(data);
		if (!item) return [];
		return this._handleDroppedItem(event, item);
	}

	async _handleDroppedItem(event, item) {
		const itemSource = item.toObject();
		const tab = event.target.closest('.tab')?.dataset?.tab;
		let allowDrop = false;
		switch (itemSource.type) {
			case 'ethnicity':
				allowDrop = tab === 'character';
				break;
			case 'spell':
				allowDrop = tab === 'actions';
				break;
			case 'equipment':
				allowDrop = tab === 'inventory';
				break;
			case 'weapon':
				allowDrop = tab === 'inventory' || tab === 'actions';
				break;
			default:
				break;
		}
		if (allowDrop) {
			if (itemSource.type === 'equipment' || itemSource.type === 'weapon') {
				const weightOk = this.actor.checkWeight(itemSource);
				if (!weightOk) {
					displayWarning('Madness.Message.Warning.EquipmentOverweight');
				}
			}
			if (itemSource.type === 'weapon') {
				const weaponSlotsOk = this.actor.checkWeaponSlots();
				if (!weaponSlotsOk) {
					displayWarning('Madness.Message.Warning.NoAvailableWeaponSlot');
				}
			}
			return this._onDropItemCreate(
				new Item.implementation(itemSource).clone().toObject(),
			);
		}
	}

	activateListeners($html) {
		super.activateListeners($html);

		const html = $html[0];

		const actor = this.actor;
		const system = actor.system;
		this._generateAttributesTooltip(html, system.attributes);
		this._generateSpellsTooltip(
			html,
			actor.items.filter((i) => i.type === 'spell'),
		);
		this._generateWeaponsTooltip(
			html,
			actor.items.filter((i) => i.type === 'weapon'),
		);

		const characterTab = html.querySelector('.tab[data-tab=character]');
		if (characterTab && this.isEditable) {
			const contextMenuEntryEdit = {
				name: 'Madness.Controls.Edit',
				icon: fontAwesomeIcon('edit'),
				callback: ($target) => {
					const itemId = $target[0].closest('[data-item-id]')?.dataset.itemId;
					const item = actor.items.get(itemId);
					item.sheet.render(true, { focus: true });
				},
			};

			const contextMenuEntryDelete = {
				name: 'Madness.Controls.Delete',
				icon: fontAwesomeIcon('trash'),
				callback: ($target) => {
					const itemId = $target[0].closest('[data-item-id]')?.dataset.itemId;
					const item = actor.items.get(itemId);
					item.delete();
				},
			};

			new ContextMenu(
				characterTab,
				'.detail-item-control',
				[contextMenuEntryEdit, contextMenuEntryDelete],
				{
					eventName: 'click',
					onOpen: () => {
						const menu = document.getElementById('context-menu');
						if (menu) {
							const leftPlacement = 1 * Math.floor(0.95 * menu.clientWidth);
							menu.style.right = `${leftPlacement}px`;
						}
					},
				},
			);
		}

		this.activateClickListener(html);
	}

	activateClickListener(html) {
		const handlers = {};

		handlers['addMP'] = () => {
			this.actor.regenMP();
		};

		handlers['edit-attributes'] = () => {
			return new EditAttributesPopup(this.actor).render(true);
		};

		handlers['edit-magics'] = () => {
			return new EditMagicsPopup(this.actor).render(true);
		};

		handlers['edit-item'] = (event, anchor) => {
			const itemId =
				anchor.closest('[data-item-id]')?.dataset.itemId ??
				anchor.closest('[data-id]')?.dataset.id;
			const item = this.actor.items.get(itemId);
			item.sheet.render(true, { focus: true });
		};

		handlers['delete'] = (event, anchor) => {
			const id = anchor.closest('[data-id]')?.dataset.id;
			const item = this.actor.items.get(id);
			item.delete();
		};

		handlers['open-compendium'] = (_, actionTarget) => {
			return game.packs
				.get(actionTarget.dataset.compendium ?? '')
				?.render(true);
		};

		handlers['reload-weapon'] = (event, anchor) => {
			const weaponId = anchor.closest('.weapon[data-id]')?.dataset.id;
			if (weaponId) {
				const weapon = this.actor.items.get(weaponId);
				return weapon.reload();
			}
		};

		handlers['roll-check'] = (event, anchor) => {
			let attrId = anchor.closest('[data-attribute]')?.dataset.attribute;
			if (attrId) {
				const attr = this.actor.getAttribute(attrId);
				return attr.roll();
			} else {
				attrId = anchor.closest('[data-secondary-attribute]')?.dataset
					.secondaryAttribute;
				const attr = this.actor.getSecondaryAttribute(attrId);
				const rollFormula = CONFIG.Madness.formulas.rolls[attrId];
				return attr.roll(rollFormula);
			}
		};

		handlers['roll-spell'] = async (event, anchor) => {
			const cantUseMagicEffects = this.actor.effects.filter((actorEffect) =>
				actorEffect.system.effects?.some((e) => e.name === 'cantUseMagic'),
			);
			if (cantUseMagicEffects.length) {
				const confirmDialogTitle = game.i18n.localize('Madness.Dialog.Confirm');
				const cantUseMagicTranslation = game.i18n.localize(
					'Madness.Dialog.CantUseMagic',
				);
				const becauseTranslation = uncapitalizeFirstLetter(
					game.i18n.localize('Madness.Dialog.Reason.Because'),
				);
				const reasonTranslation = uncapitalizeFirstLetter(
					game.i18n.format(
						cantUseMagicEffects.length > 1
							? 'Madness.Dialog.Reason.ActorEffects'
							: 'Madness.Dialog.Reason.ActorEffect',
						{
							effects: cantUseMagicEffects.map((e) => e.name).join(', '),
						},
					),
				);
				const askContinueTranslation = game.i18n.localize(
					'Madness.Dialog.AskContinue',
				);
				const confirmUse = await Dialog.confirm({
					title: confirmDialogTitle,
					content: `${cantUseMagicTranslation} ${becauseTranslation} ${reasonTranslation}. ${askContinueTranslation}`,
				});
				if (!confirmUse) return;
			}
			const spellId = anchor.closest('.spell[data-id]')?.dataset.id;
			if (spellId) {
				const spell = this.actor.items.get(spellId);
				return spell.roll();
			}
		};

		handlers['roll-weapon'] = (event, anchor) => {
			const weaponId = anchor.closest('.weapon[data-id]')?.dataset.id;
			if (weaponId) {
				const weapon = this.actor.items.get(weaponId);
				return weapon.roll();
			}
		};

		const sheetHandler = async (event) => {
			const element = event.target;
			const actionTarget = element.closest('[data-action]');
			const handler = handlers[actionTarget?.dataset.action ?? ''];
			if (handler && actionTarget) {
				event.stopImmediatePropagation();
				// Temporarily remove the listener to ignore unintentional double clicks
				html.removeEventListener('click', sheetHandler);
				try {
					await handler(event, actionTarget);
				} catch (error) {
					console.error(error);
				} finally {
					html.addEventListener('click', sheetHandler);
				}
			}
		};

		html.addEventListener('click', sheetHandler);

		return handlers;
	}

	_generateAttributesTooltip(html, attributes) {
		Object.entries(attributes).forEach(([key, value]) => {
			const tooltip = this._generateAttributeTooltip(value).join('<br />');
			this._addTooltip(html, `.attribute-total[data-id=${key}]`, tooltip);
		});
	}

	_generateAttributeTooltip(value) {
		const naturalStr = `${game.i18n.localize('Madness.Label.Character')} : ${value.value >= 0 ? '+' : ''}${value.value}`;
		const modifiersStr = value._modifiers.reduce((str, modifier) => {
			if (str.length) str += '<br />';
			return (str += `${game.i18n.localize(`Madness.Label.${modifier.sourceType}`)} : ${modifier.modifier >= 0 ? '+' : ''}${modifier.modifier}`);
		}, '');
		return [naturalStr, modifiersStr];
	}

	_addTooltip(html, querySelector, tooltip) {
		html.querySelector(querySelector).dataset.tooltip = tooltip;
	}

	async _generateSpellsTooltip(html, spells) {
		for (const spell of spells) {
			const tooltip = await this._generateSpellTooltip(spell);
			this._addTooltip(html, `.spell[data-id='${spell.id}']`, tooltip);
		}
	}

	_generateSpellTooltip(spell) {
		const damageFormula =
			Formula.generateFormulaStrFromDice(
				spell.system.damage,
				spell.damageMod,
			) || '0';
		const critFailureMod =
			spell.criFailureRateMod + this.actor.criticalFailureRateMod;
		const spellData = {
			damageFormula,
			system: spell.system,
			effects: spell.system.items,
			criticalFailureScore: new Formula(
				CONFIG.Madness.formulas.scores.criticalFailure,
			).evaluate({ mod: critFailureMod }).evaluated,
			criticalSuccessScore: new Formula(
				CONFIG.Madness.formulas.scores.critical,
			).evaluate({
				actorCritRate: this.actor.system.secondaryAttributes.critRate.total,
				mod: spell.critRateMod,
			}).evaluated,
		};
		return renderTemplate(
			'systems/madness/templates/actor/tooltips/spell.hbs',
			spellData,
		);
	}

	async _generateWeaponsTooltip(html, weapons) {
		for (const weapon of weapons) {
			const tooltip = await this._generateWeaponTooltip(weapon);
			this._addTooltip(html, `.weapon[data-id='${weapon.id}']`, tooltip);
		}
	}

	_generateWeaponTooltip(weapon) {
		const damageFormula =
			Formula.generateFormulaStrFromDice(
				weapon.system.damage,
				weapon.damageMod,
			) || '0';
		const critFailureMod =
			weapon.criFailureRateMod + this.actor.criticalFailureRateMod;
		const weaponData = {
			damageFormula,
			system: weapon.system,
			modules: Object.values(weapon.system.modules).reduce((modules, value) => {
				if (value.id) {
					const moduleConfig = foundry.utils.deepClone(
						CONFIG.Madness.modules[value.id],
					);
					modules[value.id] = moduleConfig;
					if (moduleConfig.effects) {
						modules[value.id].effects = moduleConfig.effects.map((e) => {
							const modifier = weapon.getPassiveModifier(e.name);
							return {
								name: e.name,
								value: isNaN(modifier) ? '' : modifier,
							};
						});
					}
				}
				return modules;
			}, {}),
			effects: weapon.system.items,
			criticalFailureScore: new Formula(
				CONFIG.Madness.formulas.scores.criticalFailure,
			).evaluate({ mod: critFailureMod }).evaluated,
			criticalSuccessScore: new Formula(
				CONFIG.Madness.formulas.scores.critical,
			).evaluate({
				actorCritRate: this.actor.system.secondaryAttributes.critRate.total,
				mod: weapon.critRateMod,
			}).evaluated,
		};
		return renderTemplate(
			'systems/madness/templates/actor/tooltips/weapon.hbs',
			weaponData,
		);
	}
}

export { ActorSheetMadness };
