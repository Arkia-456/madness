import { ActorMadness } from '../../module/actor/index.js';
import { ItemProxyMadness } from '../../module/item/index.js';

export const Load = {
	listen: () => {
		CONFIG.Actor.documentClass = ActorMadness;
		CONFIG.Item.documentClass = ItemProxyMadness;
	},
};
