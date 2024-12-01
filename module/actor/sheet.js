import {
	capitalizeFirstLetter,
	createHTMLElement,
	displayWarning,
	elide,
	fontAwesomeIcon,
	objectMap,
	uncapitalizeFirstLetter,
} from '../../utils/index.js';
import { ChatMessageMadness } from '../chat-message/document.js';
import Tooltip from '../system/tooltip.js';
import { EditAttributesPopup } from './popups/edit-attributes-popup.js';
import { EditMagicsPopup } from './popups/edit-magics-popup.js';

class ActorSheetMadness extends ActorSheet {
	static TOOLTIPS_PATH = 'systems/madness/templates/actor/tooltips/';

	static get defaultOptions() {
		const options = super.defaultOptions;
		foundry.utils.mergeObject(options, {
			classes: [...options.classes, 'madness', 'sheet', 'character'],
			width: 750,
			height: 750,
			tabs: [
				{
					navSelector: 'nav.sheet-navigation',
					contentSelector: '.sheet-content',
					initial: 'character',
				},
			],
		});
		return options;
	}

	get consumableWeapons() {
		return this.actor.consumableWeapons.map((weapon) =>
			foundry.utils.mergeObject(weapon, {
				minDamage: weapon.getMinDamage(this.actor.system.attributes),
				maxDamage: weapon.getMaxDamage(this.actor.system.attributes),
			}),
		);
	}

	get equipments() {
		const equipments = {};
		this.actor.equipments.forEach((e) => (equipments[e.system.slot] = e));
		return equipments;
	}

	get genericItems() {
		return this.actor.genericItems;
	}

	get otherPassives() {
		return this.actor.items.reduce((items, i) => {
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
	}

	get passiveEffectsList() {
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
		return {
			...attributesPassives,
			...magicsPassives,
			...statusImmunities,
			...otherPassives,
		};
	}

	get spells() {
		return this.actor.spells.map((spell) =>
			foundry.utils.mergeObject(spell, {
				minDamage: spell.getMinDamage(this.actor.system.attributes),
				maxDamage: spell.getMaxDamage(this.actor.system.attributes),
			}),
		);
	}

	get template() {
		return 'systems/madness/templates/actor/sheet.hbs';
	}

	get weapons() {
		return this.actor.weapons.map((weapon) =>
			foundry.utils.mergeObject(weapon, {
				minDamage: weapon.getMinDamage(this.actor.system.attributes),
				maxDamage: weapon.getMaxDamage(this.actor.system.attributes),
			}),
		);
	}

	async getData(options) {
		const sheetData = await super.getData(options);
		const actor = this.actor;

		sheetData.system = actor.system;
		sheetData.ethnicity = actor.ethnicity;

		sheetData.consumableWeapons = this.consumableWeapons;
		sheetData.spells = this.spells;
		sheetData.equipments = this.equipments;
		sheetData.weapons = this.weapons;
		sheetData.items = [...this.genericItems, ...this.consumableWeapons];
		sheetData.otherPassives = this.otherPassives;

		sheetData.config = CONFIG.Madness.default;

		sheetData.passivesEffects = this.passiveEffectsList;

		// Enriched content
		const enrichedContent = {};
		enrichedContent.notes = await TextEditor.enrichHTML(actor.system.notes);
		sheetData.enrichedContent = enrichedContent;

		return sheetData;
	}

	/* ------------------------------- */
	/*  Event listeners                */
	/* ------------------------------- */

	activateListeners($html) {
		super.activateListeners($html);

		const html = $html[0];

		this._generateTooltips(html);

		const characterTab = html.querySelector('.tab[data-tab=character]');
		if (characterTab && this.isEditable) {
			this._createEthnicityContextMenu(characterTab);
		}

		this.activateClickListener(html);
	}

	activateClickListener(html) {
		const handlers = {};

		handlers['addMP'] = () => {
			this.actor.addMP();
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
			this._onClickEditItem(anchor);
		};

		handlers['delete'] = async (event, anchor) => {
			this._onClickDeleteItem(event, anchor);
		};

		handlers['delete-passive'] = async (event, anchor) => {
			this._onClickDeletePassive(event, anchor);
		};

		handlers['open-compendium'] = (_, actionTarget) => {
			return game.packs
				.get(actionTarget.dataset.compendium ?? '')
				?.render(true);
		};

		handlers['reload-weapon'] = (event, anchor) => {
			this._onClickReloadWeapon(anchor);
		};

		handlers['add-ammo'] = (event, anchor) => {
			this._onClickAddWeaponAmmo(anchor);
		};

		handlers['remove-ammo'] = (event, anchor) => {
			this._onClickRemoveWeaponAmmo(anchor);
		};

		handlers['roll-check'] = (event, anchor) => {
			this._onClickRollAttribute(anchor);
		};

		handlers['roll-spell'] = async (event, anchor) => {
			this._onClickRollSpell(event, anchor);
		};

		handlers['roll-weapon'] = (event, anchor) => {
			this._onClickRollWeapon(event, anchor);
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

	/* ------------------------------- */
	/*  Tooltip generation             */
	/* ------------------------------- */

	/**
	 * Generate tooltips
	 * @param {HTMLElement} html sheet HTML element
	 */
	_generateTooltips(html) {
		const { system } = this.actor;
		this._generateArmorTooltip(html, system.armor);
		this._generateAttributesTooltip(html, {
			...system.attributes,
			...system.secondaryAttributes,
			...system.magics,
		});
		this._generateSkillsTooltips(html, this.actor.skills);
	}

	_generateArmorTooltip(html, armor) {
		Tooltip.generate(
			armor,
			{ rendered: this._generateArmorTooltipTemplate(armor) },
			html,
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
			Tooltip.generate(
				attr,
				{
					rendered: this._generateAttributeTooltipTemplate(attr).join('<br />'),
				},
				html,
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
		skills.forEach((skill) => {
			Tooltip.generate(
				skill,
				{
					templatePath: `${ActorSheetMadness.TOOLTIPS_PATH}${skill.sheetType}.hbs`,
				},
				html,
				`.${skill.sheetType}[data-id='${skill.id}']`,
			);
		});
	}

	/* ------------------------------- */
	/*  Click handlers                 */
	/* ------------------------------- */

	async _onClickDeleteItem(event, anchor) {
		const id = anchor.closest('[data-id]')?.dataset.id;
		if (!id) return;
		const item = this.actor.items.get(id);
		if (!item) return;
		const allowDelete = event.shiftKey
			? true
			: await Dialog.confirm({
					title: game.i18n.localize('Madness.Dialog.Confirm'),
					content: game.i18n.localize('Madness.Dialog.AskDelete'),
				});
		if (allowDelete) {
			item.delete();
		}
	}

	_onClickEditItem(anchor) {
		const id =
			anchor.closest('[data-item-id]')?.dataset.itemId ??
			anchor.closest('[data-id]')?.dataset.id;
		if (!id) return;
		const item = this.actor.items.get(id);
		if (!item) return;
		item.sheet.render(true, { focus: true });
	}

	async _onClickRollSpell(event, anchor) {
		if (!this.actor.canUseMagic) {
			const preventMagicUseEffects = this.actor.preventMagicUseEffects;
			const confirmDialogTitle = game.i18n.localize('Madness.Dialog.Confirm');
			const cantUseMagicTranslation = game.i18n.localize(
				'Madness.Dialog.CantUseMagic',
			);
			const becauseTranslation = uncapitalizeFirstLetter(
				game.i18n.localize('Madness.Dialog.Reason.Because'),
			);
			const reasonTranslation = uncapitalizeFirstLetter(
				game.i18n.format(
					preventMagicUseEffects.length > 1
						? 'Madness.Dialog.Reason.ActorEffects'
						: 'Madness.Dialog.Reason.ActorEffect',
					{
						effects: preventMagicUseEffects.map((e) => e.name).join(', '),
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
		this._rollItem(event, anchor, 'spell');
	}

	_onClickAddWeaponAmmo(anchor) {
		const id = anchor.closest('.weapon[data-id]')?.dataset.id;
		if (!id) return;
		this.actor.items.get(id)?.addAmmo();
	}

	_onClickReloadWeapon(anchor) {
		const id = anchor.closest('.weapon[data-id]')?.dataset.id;
		if (!id) return;
		this.actor.items.get(id)?.reload();
	}

	_onClickRemoveWeaponAmmo(anchor) {
		const id = anchor.closest('.weapon[data-id]')?.dataset.id;
		if (!id) return;
		this.actor.items.get(id)?.removeAmmo();
	}

	_onClickRollWeapon(event, anchor) {
		this._rollItem(event, anchor, 'weapon');
	}

	_rollItem(event, anchor, type) {
		const id = anchor.closest(`.${type}[data-id]`)?.dataset.id;
		if (!id) return;
		this.actor.items.get(id)?.roll({ promptModifiers: event.shiftKey });
	}

	async _onClickDeletePassive(event, anchor) {
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
	}

	async _onClickRollAttribute(anchor) {
		const primaryAttributeAnchor = anchor.closest('[data-attribute]');
		const id = primaryAttributeAnchor
			? primaryAttributeAnchor.dataset.attribute
			: anchor.closest('[data-secondary-attribute]')?.dataset
					.secondaryAttribute;
		const { label, roll: rollPromise } = primaryAttributeAnchor
			? this._rollPrimaryAttribute(id)
			: this._rollSecondaryAttribute(id);

		const roll = await rollPromise;
		if (roll) {
			const speaker = ChatMessageMadness.getSpeaker({
				actor: this.actor,
				token: this.actor.getActiveTokens(true, true)[0],
			});
			const title = `${elide(game.i18n.localize('Madness.ChatMessage.CheckOf'), label)}${label.toLowerCase()}`;
			const flavor = createHTMLElement('h4', [title]).outerHTML;
			roll.toMessage({ speaker, flavor });
		}
	}

	_rollPrimaryAttribute(id) {
		const attribute = this.actor.getAttribute(id);
		if (!attribute) throw new Error(`No attribute with id ${id}`);
		return { label: attribute.label, roll: attribute.roll() };
	}

	_rollSecondaryAttribute(id) {
		const attribute = this.actor.getSecondaryAttribute(id);
		if (!attribute) throw new Error(`No secondary attribute with id ${id}`);
		return {
			label: attribute.label,
			roll: attribute.roll(CONFIG.Madness.formulas.rolls[id]),
		};
	}

	/**
	 * Create a context menu from ethnicity control
	 * @param {HTMLElement} tab the tab in which to create the context menu
	 * @returns created context menu
	 */
	_createEthnicityContextMenu(tab) {
		const contextMenuEntryEdit = {
			name: 'Madness.Controls.Edit',
			icon: fontAwesomeIcon('edit'),
			callback: ($target) => {
				const itemId = $target[0].closest('[data-item-id]')?.dataset.itemId;
				const item = this.actor.items.get(itemId);
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
				const item = this.actor.items.get(itemId);
				const confirmDelete = await Dialog.confirm({
					title: game.i18n.localize('Madness.Dialog.Confirm'),
					content: game.i18n.localize('Madness.Dialog.AskDelete'),
				});
				if (confirmDelete) item.delete();
			},
		};

		return new ContextMenu(
			tab,
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

	/* ------------------------------- */
	/*  Drag & Drop                    */
	/* ------------------------------- */

	async _onDropItem(event, data) {
		event.preventDefault();
		const item = await Item.fromDropData(data);
		if (!item) return [];
		return this._handleDroppedItem(event, item);
	}

	/**
	 * Handle dropping of an item onto the sheet
	 * @param {DragEvent} event the drag event containing drop data
	 * @param {object} item the item data
	 * @returns {Promise<Array<Item>>} the created items
	 */
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
			case 'consumable-weapon':
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
			if (itemSource.type === 'equipment' || itemSource.isWeapon) {
				const weightOk = this.actor.checkWeightWithNewItem(itemSource);
				if (!weightOk) {
					displayWarning('Madness.Message.Warning.EquipmentOverweight');
				}
			}
			if (itemSource.isWeapon) {
				const weaponSlotsOk = this.actor.checkWeaponSlots();
				if (!weaponSlotsOk) {
					displayWarning('Madness.Message.Warning.NoAvailableWeaponSlot');
				}
			}
			return this._onDropItemCreate(
				new Item.implementation(itemSource).clone().toObject(),
			);
		}
		return [];
	}
}

export { ActorSheetMadness };
