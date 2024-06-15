import { MadnessConfig } from '../config/index.js';
import { registerHandlebarsHelpers } from '../handlebars.js';

export const Init = {
	listen: () => {
		Hooks.once('init', () => {
			console.log('Madness system | Initializing...');
			CONFIG.Madness = MadnessConfig;

			registerHandlebarsHelpers();
			console.log('Madness system | Successfully initialized ✅');
		});
	},
};
