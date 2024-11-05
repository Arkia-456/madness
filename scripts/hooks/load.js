import { ActiveEffectMadness } from '../../module/active-effect/document.js';
import { ActorMadness } from '../../module/actor/index.js';
import { ChatMessageMadness } from '../../module/chat-message/index.js';
import { CombatantMadness } from '../../module/encounter/combatant/document.js';
import { EncounterMadness } from '../../module/encounter/document.js';
import { ItemProxyMadness } from '../../module/item/index.js';
import { UserMadness } from '../../module/user/index.js';

export const Load = {
	listen: () => {
		CONFIG.ActiveEffect.documentClass = ActiveEffectMadness;
		CONFIG.Actor.documentClass = ActorMadness;
		CONFIG.ChatMessage.documentClass = ChatMessageMadness;
		CONFIG.Combat.documentClass = EncounterMadness;
		CONFIG.Combatant.documentClass = CombatantMadness;
		CONFIG.Item.documentClass = ItemProxyMadness;
		CONFIG.User.documentClass = UserMadness;
	},
};
