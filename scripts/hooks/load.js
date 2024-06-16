import { ActorMadness } from '../../module/actor/index.js';
import { ChatMessageMadness } from '../../module/chat-message/index.js';
import { ItemProxyMadness } from '../../module/item/index.js';
import { UserMadness } from '../../module/user/index.js';

export const Load = {
	listen: () => {
		CONFIG.Actor.documentClass = ActorMadness;
		CONFIG.ChatMessage.documentClass = ChatMessageMadness;
		CONFIG.Item.documentClass = ItemProxyMadness;
		CONFIG.User.documentClass = UserMadness;
	},
};
