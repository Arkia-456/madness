import { htmlQueryAll } from '../../utils/index.js';

export class StatusEffects {
	static EFFECT_CONTROL_CLASS = 'effect-control';
	static EFFECT_NAME_CONTAINER_CLASS = 'effect-name';
	static EFFECTS_GRID_SELECTOR = '.status-effects';
	static ICONS_PATH = 'systems/madness/resources/icons/status-effects/';

	/**
	 * Initialize status effects by replacing Foundry VTT's
	 */
	static initialize() {
		CONFIG.statusEffects = Object.entries(CONFIG.Madness.statusEffects).map(
			([id, statusEffect]) => ({
				id: id,
				name: statusEffect.name,
				img: `${StatusEffects.ICONS_PATH}${id}.png`,
				effects: statusEffect.effects,
				durations: statusEffect.durations,
				slug: id,
				stackable: statusEffect.stackable,
			}),
		);
	}

	/**
	 * Called during token HUD render
	 * @param {HTMLElement} html token HUD HTML element
	 * @param {TokenHUDData} tokenData token data
	 */
	static onRenderTokenHUD(html, tokenData) {
		const token = canvas.tokens.get(tokenData._id);
		if (!token) return;

		const iconGrid = html.querySelector(StatusEffects.EFFECTS_GRID_SELECTOR);
		if (!iconGrid) {
			throw new Error('Unexpected error retrieving status effects grid');
		}

		StatusEffects._createStatusNameContainer(iconGrid);
		StatusEffects._replaceIcons(iconGrid, token);
		StatusEffects._activateListeners(iconGrid);
	}

	static _createStatusNameContainer(grid) {
		const container = document.createElement('div');
		container.classList.add(StatusEffects.EFFECT_NAME_CONTAINER_CLASS);
		grid.append(container);
	}

	/**
	 * Wrap icons in div, activate active effects and set stacks badge
	 * @param {HTMLElement} grid grid in which to replace icons
	 * @param {Token} token current token
	 */
	static _replaceIcons(grid, token) {
		const statusIcons = grid.querySelectorAll(
			`.${StatusEffects.EFFECT_CONTROL_CLASS}`,
		);
		for (const icon of statusIcons) {
			const statusId = icon.dataset.statusId;

			const newIcon = StatusEffects._replaceIcon(icon);

			const affecting = token.actor.effects.find(
				(e) => e.system.slug === statusId,
			);
			if (affecting) {
				newIcon.classList.add('active');

				const stacks = affecting.system.stacks;
				if (stacks > 0) {
					StatusEffects._setIconBadge(newIcon, stacks);
				}
			}
		}
	}

	/**
	 * Wrap and icon in a div
	 * @param {HTMLElement} original original icon to replace
	 * @returns div containing the icon
	 */
	static _replaceIcon(original) {
		const statusId = original.dataset.statusId;

		const iconContainer = document.createElement('div');
		iconContainer.classList.add(StatusEffects.EFFECT_CONTROL_CLASS);
		iconContainer.dataset.statusId = statusId;
		iconContainer.title = original.dataset.tooltip ?? '';

		const newIcon = document.createElement('img');
		newIcon.src = original.getAttribute('src');

		iconContainer.append(newIcon);
		original.replaceWith(iconContainer);
		return iconContainer;
	}

	/**
	 * Add a badge to icon
	 * @param {HTMLElement} icon icon to add the badge to
	 * @param {string|number} value badge value
	 */
	static _setIconBadge(icon, value) {
		const badge = document.createElement('i');
		badge.classList.add('badge');
		badge.innerHTML = value;
		icon.append(badge);
	}

	/**
	 * Activate event listeners which provide interactivity for the icons grid.
	 * @param {HTMLElement} grid icons grid
	 */
	static _activateListeners(grid) {
		htmlQueryAll(grid, `.${StatusEffects.EFFECT_CONTROL_CLASS}`).forEach(
			(control) => {
				control.addEventListener('click', (event) =>
					StatusEffects._setStatusValue(control, event),
				);
				control.addEventListener('contextmenu', (event) =>
					StatusEffects._setStatusValue(control, event),
				);
				control.addEventListener('mouseover', () =>
					StatusEffects._showStatusName(control, true),
				);
				control.addEventListener('mouseout', () =>
					StatusEffects._showStatusName(control, false),
				);
			},
		);
	}

	/**
	 * A click event handler to increase or decrease status effect
	 * @param {HTMLElement} control
	 * @param {MouseEvent} event
	 */
	static _setStatusValue(control, event) {
		event.preventDefault();
		event.stopPropagation();

		const slug = control.dataset.statusId;
		const status = CONFIG.statusEffects.find((e) => e.id === slug);

		if (!status) return;

		const tokens = canvas.tokens.controlled;

		tokens.forEach((token) => {
			if (event.type === 'click') {
				token.actor.increaseStatusEffect(slug);
			} else if (event.type === 'contextmenu') {
				token.actor.decreaseStatusEffect(slug);
			}
		});
	}

	/**
	 * A mouse event handler that show or hide status name
	 * @param {HTMLElement} control
	 * @param {boolean} show
	 */
	static _showStatusName(control, show = false) {
		const namecontainer = control
			.closest(StatusEffects.EFFECTS_GRID_SELECTOR)
			?.querySelector(`.${StatusEffects.EFFECT_NAME_CONTAINER_CLASS}`);
		if (namecontainer && control.title) {
			namecontainer.innerText = control.title;
			if (show) {
				namecontainer.classList.add('active');
				return;
			}
		}
		namecontainer.classList.remove('active');
	}
}
