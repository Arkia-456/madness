import { Init } from './init.js';
import { Load } from './load.js';
import { RenderTokenHUD } from './render-token-hud.js';
import { Setup } from './setup.js';

export const HooksMadness = {
	listen() {
		const listeners = [Load, Init, Setup, RenderTokenHUD];
		listeners.forEach((listener) => listener.listen());
	},
};
