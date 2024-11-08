import { isEmptyObject } from './misc.js';

function displayError(translationKey, options = {}) {
	const message = isEmptyObject(options)
		? game.i18n.localize(translationKey)
		: game.i18n.format(translationKey, options);
	ui.notifications.error(message);
}

function displayWarning(translationKey, options = {}) {
	const message = isEmptyObject(options)
		? game.i18n.localize(translationKey)
		: game.i18n.format(translationKey, options);
	ui.notifications.warn(message);
}

export { displayError, displayWarning };
