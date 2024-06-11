import { registerSheets } from '../register-sheets.js';
export const Setup = {
	listen: () => {
		Hooks.once('setup', () => {
			console.log('Madness system | Setup...');
			registerSheets();
			console.log('Madness system | Successfully setup ✅');
		});
	},
};
