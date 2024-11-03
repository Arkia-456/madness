import { CheckMadness } from '../../system/check.js';
import { ItemMadness } from '../index.js';

class WeaponMadness extends ItemMadness {
	prepareBaseData() {
		super.prepareBaseData();
		if (this.system.ammo.value === undefined) {
			this.update({ 'system.ammo.value': this.system.ammo.max });
		}
	}

	async roll() {
		const context = {
			actor: this.actor,
			item: this,
			rollType: 'weapon',
		};
		if (!this.checkAmmo()) {
			const notEnoughAmmoErrorMsg = game.i18n.localize(
				'Madness.Message.Error.NotEnoughAmmo',
			);
			return ui.notifications.error(notEnoughAmmoErrorMsg);
		}
		const roll = await CheckMadness.roll(context);
		if (roll.critOutcome.result === 'success') {
			this.removeAmmo();
		}
		this.toMessage({ context, roll });
	}

	checkAmmo() {
		return this.system.ammo.value > 0;
	}

	removeAmmo() {
		this.update({ 'system.ammo.value': this.system.ammo.value - 1 });
	}
}

export { WeaponMadness };
