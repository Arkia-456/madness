import { MadnessConfig } from '../config/index.js';
import { registerHandlebarsHelpers } from '../handlebars.js';
import { StatusEffects } from '../../module/canvas/status-effect.js';

export const Init = {
	listen: () => {
		Hooks.once('init', () => {
			console.log('Madness system | Initializing...');
			CONFIG.Madness = MadnessConfig;

			registerHandlebarsHelpers();
			StatusEffects.initialize();
			console.log('Madness system | Successfully initialized ✅');
		});
	},
};
