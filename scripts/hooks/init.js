export const Init = {
	listen: () => {
		Hooks.once('init', () => {
			console.log('Madness system | Initializing...');
			console.log('Madness system | Successfully initialized ✅');
		});
	},
};
