import { registerSheets } from '../register-sheets.js';
import { registerTemplates } from '../register-templates.js';

export const Setup = {
	listen: () => {
		Hooks.once('setup', () => {
			console.log('Madness system | Setup...');
			registerSheets();
			registerTemplates();
			console.log('Madness system | Successfully setup ✅');
		});
	},
};
