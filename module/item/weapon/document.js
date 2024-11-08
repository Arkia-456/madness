import { capitalizeFirstLetter } from '../../../utils/index.js';
import { SkillMadness } from '../skill/index.js';

class WeaponMadness extends SkillMadness {
	prepareBaseData() {
		super.prepareBaseData();
		if (this.system.ammo.value === undefined) {
			this.update({ 'system.ammo.value': this.system.ammo.max });
		}
	}

	get passives() {
		const effectPassives = super.passives;
		const modulePassives =
			Object.entries(this.system.modules).reduce((arr, module) => {
				if (module[1].id) {
					const moduleId = capitalizeFirstLetter(module[1].id);
					const effects = CONFIG.Madness.Modules[moduleId]?.Effects;
					if (effects) arr.push(...effects);
				}
				return arr;
			}, []) ?? [];
		return [...modulePassives, ...effectPassives];
	}

	reload() {
		this.update({ 'system.ammo.value': this.system.ammo.max });
	}

	async roll(options = {}) {
		return super.roll({
			...options,
			rollType: 'weapon',
			removeResources: true,
		});
	}

	checkBeforeRoll() {
		if (this.checkAmmo()) return true;
		const notEnoughAmmoErrorMsg = game.i18n.localize(
			'Madness.Message.Error.NotEnoughAmmo',
		);
		ui.notifications.error(notEnoughAmmoErrorMsg);
		return false;
	}

	removeResources() {
		this.removeAmmo();
	}

	checkAmmo() {
		return this.system.ammo.value > 0;
	}

	removeAmmo() {
		this.update({ 'system.ammo.value': this.system.ammo.value - 1 });
	}
}

export { WeaponMadness };
