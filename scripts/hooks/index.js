import { Init } from './init.js';
import { Load } from './load.js';
import { Setup } from './setup.js';

export const HooksMadness = {
	listen() {
		const listeners = [Load, Init, Setup];
		listeners.forEach((listener) => listener.listen());
	},
};
