import { capitalizeFirstLetter, htmlQueryAll } from '../../utils/index.js';

export class StatusEffects {
	static initialize() {
		CONFIG.statusEffects = Object.entries(
			CONFIG.Madness.StatusEffects.List,
		).map(([id, name]) => ({
			id,
			name,
			img: `systems/madness/resources/icons/status-effects/${id}.png`,
			effects: CONFIG.Madness.StatusEffects[capitalizeFirstLetter(id)]?.Effects,
			slug: id,
			stackable: CONFIG.Madness.StatusEffects.StackableEffects.includes(id),
		}));
	}

	static onRenderTokenHUD(html, tokenData) {
		const token = canvas.tokens.get(tokenData._id);
		if (!token) return;

		const iconGrid = html.querySelector('.status-effects');
		if (!iconGrid) {
			throw new Error('Unexpected error retrieving status effects grid');
		}

		const statusIcons = iconGrid.querySelectorAll('.effect-control');
		for (const icon of statusIcons) {
			const statusId = icon.dataset.statusId;
			const iconContainer = document.createElement('div');
			iconContainer.classList.add('effect-control');
			iconContainer.dataset.statusId = statusId;
			iconContainer.title = icon.dataset.tooltip ?? '';
			const newIcon = document.createElement('img');
			newIcon.src = icon.getAttribute('src');
			iconContainer.append(newIcon);
			icon.replaceWith(iconContainer);

			const affecting = token.actor.effects.find(
				(e) => e.system.slug === statusId,
			);
			if (affecting) {
				iconContainer.classList.add('active');

				const stacks = affecting.system.stacks;
				if (stacks > 0) {
					const badge = document.createElement('i');
					badge.classList.add('badge');
					badge.innerHTML = stacks;
					iconContainer.append(badge);
				}
			}
		}

		StatusEffects._activateListeners(iconGrid);
	}

	static _activateListeners(html) {
		htmlQueryAll(html, '.effect-control').forEach((control) => {
			control.addEventListener('click', (event) =>
				StatusEffects._setStatusValue(control, event),
			);
			control.addEventListener('contextmenu', (event) =>
				StatusEffects._setStatusValue(control, event),
			);
		});
	}

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
}
