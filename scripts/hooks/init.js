import { MadnessConfig } from '../config/index.js';

export const Init = {
	listen: () => {
		Hooks.once('init', () => {
			console.log('Madness system | Initializing...');
			CONFIG.Madness = MadnessConfig;
			console.log('Madness system | Successfully initialized ✅');
		});
	},
};
