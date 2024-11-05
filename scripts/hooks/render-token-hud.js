import { StatusEffects } from '../../module/canvas/status-effect.js';

export const RenderTokenHUD = {
	listen: () => {
		Hooks.on('renderTokenHUD', (app, $html, data) => {
			console.log('Madness system | Rendering token HUD...');
			const html = $html[0];
			StatusEffects.onRenderTokenHUD(html, data);
			console.log('Madness system | Token HUD rendered ✅');
		});
	},
};
