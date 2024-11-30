import { ChatMessageMadness } from '../../chat-message/index.js';

class CombatantMadness extends Combatant {
	endTurn() {
		this._applyDoT(this.actor, 'end');
		this._removeBuffsAndDebuffs(this.actor, 'end');
	}

	async startTurn() {
		await this._removeBuffsAndDebuffs(this.actor, 'start');
		this._logRecap();
	}

	async _logRecap() {
		const actor = this.token.actor;
		const passives = actor.effects.map((e) => {
			return {
				name: e.name,
				stacks: e.system.stacks,
				duration: e.system.durations?.reduce(
					(acc, d) => (acc += `${d.value} ${d.type}`),
					'',
				),
			};
		});
		const templateData = {
			hp: actor.system.hp.value,
			hpmax: actor.system.hp.max,
			hptemp: actor.system.hp.temp,
			mp: actor.system.mp.value,
			mpmax: actor.system.mp.max,
			armor: actor.system.armor.total,
			movement: actor.system.secondaryAttributes.maxMoveDistance.total,
			passives,
		};
		const template = 'systems/madness/templates/chat/recap-card.hbs';
		const chatData = {
			speaker: ChatMessageMadness.getSpeaker({
				actor,
				token: this.token,
			}),
			whisper: game.users.reduce((users, u) => {
				if (u.isGM) users.push(u.id);
				return users;
			}, []),
			content: await renderTemplate(template, templateData),
		};
		ChatMessageMadness.create(chatData);
	}

	_removeBuffsAndDebuffs(actor, applicationTime) {
		const durationFilter = (d) =>
			d.type === 'turn' && d.applicationTime === applicationTime;
		const effectsToRemove = actor.effects.filter((e) =>
			e.system.durations?.some(durationFilter),
		);
		if (!effectsToRemove) return;

		return actor.decreaseStatusEffectsDuration(
			effectsToRemove.map((e) => e.system.slug),
			durationFilter,
		);
	}

	_applyDoT(actor, applicationTime) {
		const filter = (e) =>
			e.type === 'damage' &&
			e.applicationType === 'turn' &&
			e.applicationTime === applicationTime;
		const dotEffects = actor.effects.reduce((arr, actorEffect) => {
			const effect = foundry.utils.deepClone(actorEffect);
			const effects = effect.system.effects?.filter(filter);
			if (!effects) return arr;
			effects.forEach((e) => {
				if (effect.system.stacks) {
					e.value *= effect.system.stacks;
				}
			});
			arr.push(...effects);
			return arr;
		}, []);
		const [bypassTempHPDamage, damage] = dotEffects.reduce(
			(arr, e) => {
				if (e.bypassTempHP) {
					arr[0] += e.value;
				} else {
					arr[1] += e.value;
				}
				return arr;
			},
			[[], []],
		);
		const context = {
			source: 'activeEffect',
			passives: [{ name: 'ignoreArmor' }],
		};
		actor.applyDamage(damage, context);
		context.passives.push({ name: 'bypassTempHP' });
		actor.applyDamage(bypassTempHPDamage, context);
	}
}

export { CombatantMadness };
