export const Setup = {
	listen: () => {
		Hooks.once('setup', () => {
			console.log('Madness system | Setup...');
			console.log('Madness system | Successfully setup ✅');
		});
	},
};
