import {
	capitalizeFirstLetter,
	displayWarning,
	fontAwesomeIcon,
	objectMap,
	uncapitalizeFirstLetter,
} from '../../utils/index.js';
import { EditAttributesPopup } from './popups/edit-attributes-popup.js';
import { EditMagicsPopup } from './popups/edit-magics-popup.js';

class ActorSheetMadness extends ActorSheet {
	static TOOLTIPS_PATH = 'systems/madness/templates/actor/tooltips/';

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
			if (i.type === 'equipment') {
				equipments[i.system.slot] = i;
			}
		});
		sheetData.equipments = equipments;
		const weapons = actor.items.filter((i) => i.type === 'weapon');
		weapons.forEach((weapon) => {
			weapon.minDamage = weapon.getMinDamage(actor.system.attributes);
			weapon.maxDamage = weapon.getMaxDamage(actor.system.attributes);
		});
		sheetData.weapons = weapons;
		sheetData.generics = actor.items.filter((i) => i.type === 'generic');
		sheetData.config = CONFIG.Madness.default;

		sheetData.otherPassives = actor.items.reduce((items, i) => {
			if (i.system.passives) {
				items.push({
					name: i.name,
					source: i.type,
					passives: Object.values(i.system.passives).reduce((arr, p) => {
						arr.push({
							...p,
							type: CONFIG.Madness.statusEffects[p.passive]
								? 'immunity'
								: 'modifier',
						});
						return arr;
					}, []),
				});
			}
			return items;
		}, []);

		// Passives

		const attributesPassives = objectMap(
			CONFIG.Madness.attributes,
			(label, attr) =>
				`Madness.Passives.Modifier.${capitalizeFirstLetter(attr)}`,
		);
		const { derion, escura, ...allowedMagics } = CONFIG.Madness.magics;
		const magicsPassives = objectMap(
			allowedMagics,
			(label, attr) =>
				`Madness.Passives.Modifier.${capitalizeFirstLetter(attr)}`,
		);
		const statusImmunities = objectMap(
			CONFIG.Madness.statusEffects,
			(statusEffect, id) =>
				`Madness.Passives.Immunity.${capitalizeFirstLetter(id)}`,
		);
		const otherPassives = Object.fromEntries(
			['armor'].map((p) => [
				p,
				`Madness.Passives.Modifier.${capitalizeFirstLetter(p)}`,
			]),
		);

		sheetData.passivesEffects = {
			...attributesPassives,
			...magicsPassives,
			...statusImmunities,
			...otherPassives,
		};

		// Enriched content
		const enrichedContent = {};
		enrichedContent.notes = await TextEditor.enrichHTML(actor.system.notes);
		sheetData.enrichedContent = enrichedContent;

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
			case 'generic':
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
				const weightOk = this.actor.checkWeightWithNewItem(itemSource);
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
		this._generateArmorTooltip(html, system.armor);
		this._generateAttributesTooltip(html, {
			...system.attributes,
			...system.secondaryAttributes,
			...system.magics,
		});
		this._generateSkillsTooltips(
			html,
			actor.items.filter((i) => ['spell', 'weapon'].includes(i.type)),
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

			const contextMenuEntrySearch = {
				name: 'Madness.Controls.Search',
				icon: fontAwesomeIcon('search'),
				callback: () => {
					game.packs.get('madness-compendium.ethnies' ?? '')?.render(true);
				},
			};

			const contextMenuEntryDelete = {
				name: 'Madness.Controls.Delete',
				icon: fontAwesomeIcon('trash'),
				callback: async ($target) => {
					const itemId = $target[0].closest('[data-item-id]')?.dataset.itemId;
					const item = actor.items.get(itemId);
					const confirmDelete = await Dialog.confirm({
						title: game.i18n.localize('Madness.Dialog.Confirm'),
						content: game.i18n.localize('Madness.Dialog.AskDelete'),
					});
					if (confirmDelete) item.delete();
				},
			};

			new ContextMenu(
				characterTab,
				'.detail-item-control',
				[contextMenuEntryEdit, contextMenuEntrySearch, contextMenuEntryDelete],
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

		handlers['create-passive'] = () => {
			this.actor.createPassive();
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

		handlers['delete'] = async (event, anchor) => {
			const id = anchor.closest('[data-id]')?.dataset.id;
			const item = this.actor.items.get(id);
			const allowDelete = event.shiftKey
				? true
				: await Dialog.confirm({
						title: game.i18n.localize('Madness.Dialog.Confirm'),
						content: game.i18n.localize('Madness.Dialog.AskDelete'),
					});
			if (allowDelete) {
				item.delete();
			}
		};

		handlers['delete-passive'] = async (event, anchor) => {
			const id = anchor.closest('[data-id]')?.dataset.id;
			const passives = this.actor.system.passives;
			const passive = passives[id];
			if (!passive) return;
			const allowDelete = event.shiftKey
				? true
				: await Dialog.confirm({
						title: game.i18n.localize('Madness.Dialog.Confirm'),
						content: game.i18n.localize('Madness.Dialog.AskDelete'),
					});
			if (allowDelete) {
				this.actor.update({ [`system.passives.-=${id}`]: null });
			}
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

		handlers['add-ammo'] = (event, anchor) => {
			const weaponId = anchor.closest('.weapon[data-id]')?.dataset.id;
			if (weaponId) {
				const weapon = this.actor.items.get(weaponId);
				return weapon.addAmmo();
			}
		};

		handlers['remove-ammo'] = (event, anchor) => {
			const weaponId = anchor.closest('.weapon[data-id]')?.dataset.id;
			if (weaponId) {
				const weapon = this.actor.items.get(weaponId);
				return weapon.removeAmmo();
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
				return spell.roll({ promptModifiers: event.shiftKey });
			}
		};

		handlers['roll-weapon'] = (event, anchor) => {
			const weaponId = anchor.closest('.weapon[data-id]')?.dataset.id;
			if (weaponId) {
				const weapon = this.actor.items.get(weaponId);
				return weapon.roll({ promptModifiers: event.shiftKey });
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

	_generateArmorTooltip(html, armor) {
		armor.generateTooltip(
			html,
			this._generateArmorTooltipTemplate(armor),
			`#armor-total[data-id='${armor.id}']`,
		);
	}

	_generateArmorTooltipTemplate(armor) {
		const modifiersStr = armor._modifiers.reduce((str, modifier) => {
			if (modifier.modifier > 0) {
				str += `${str ? '<br />' : ''}${game.i18n.localize(`Madness.Label.${modifier.sourceType}`)} : ${modifier.modifier >= 0 ? '+' : ''}${modifier.modifier}`;
			}
			return str;
		}, '');
		return modifiersStr;
	}

	_generateAttributesTooltip(html, attributes) {
		Object.values(attributes).forEach((attr) => {
			const template =
				this._generateAttributeTooltipTemplate(attr).join('<br />');
			attr.generateTooltip(
				html,
				template,
				`.attribute-total[data-id=${attr.id}]`,
			);
		});
	}

	_generateAttributeTooltipTemplate(attr) {
		const naturalStr = `${game.i18n.localize('Madness.Label.Character')} : ${attr.value >= 0 ? '+' : ''}${attr.value}`;
		const modifiersStr = attr._modifiers.reduce((str, modifier) => {
			if (str.length) str += '<br />';
			return (str += `${game.i18n.localize(`Madness.Label.${modifier.sourceType}`)} : ${modifier.modifier >= 0 ? '+' : ''}${modifier.modifier}`);
		}, '');
		return [naturalStr, modifiersStr];
	}

	_generateSkillsTooltips(html, skills) {
		skills.forEach((s) => {
			s.generateTooltip(
				html,
				`${ActorSheetMadness.TOOLTIPS_PATH}${s.type}.hbs`,
				`.${s.type}[data-id='${s.id}']`,
			);
		});
	}
}

export { ActorSheetMadness };
