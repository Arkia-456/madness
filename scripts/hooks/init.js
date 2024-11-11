import { MadnessConfig } from '../config/index.js';
import { registerHandlebarsHelpers } from '../handlebars.js';
import { StatusEffects } from '../../module/canvas/status-effect.js';
import { TokenMadness } from '../../module/canvas/token.js';
import { EffectsTrackerMadness } from '../../module/app/effect-tracker/effect-tracker.js';

export const Init = {
	listen: () => {
		Hooks.once('init', () => {
			console.log('Madness system | Initializing...');
			CONFIG.Madness = MadnessConfig;
			CONFIG.Token.objectClass = TokenMadness;

			const uiTop = document.querySelector('#ui-top');
			if (uiTop) {
				const div = document.createElement('div');
				div.setAttribute('id', 'madness-effects-tracker');
				uiTop.insertAdjacentElement('afterend', div);
			}

			game.madness = {
				effectsTracker: new EffectsTrackerMadness(),
			};

			registerHandlebarsHelpers();
			StatusEffects.initialize();
			console.log('Madness system | Successfully initialized ✅');
		});
	},
};
