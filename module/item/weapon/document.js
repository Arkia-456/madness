import { displayError } from '../../../utils/index.js';
import { SkillMadness } from '../skill/index.js';

class WeaponMadness extends SkillMadness {
	get nbModules() {
		return Object.values(this.system.modules).filter((el) => el.id).length;
	}

	get reloadable() {
		return !this.passives.some((p) => p.name === 'nonReloadable');
	}

	get passives() {
		const effectPassives = super.passives;
		const modulePassives =
			Object.entries(this.system.modules).reduce((arr, module) => {
				if (module[1].id) {
					const moduleId = module[1].id;
					const effects = CONFIG.Madness.modules[moduleId]?.effects;
					if (effects) arr.push(...effects);
				}
				return arr;
			}, []) ?? [];
		return [...modulePassives, ...effectPassives];
	}

	getPassiveModifier(modifierName, options = {}) {
		const modulesValues =
			Object.values(this.system.modules)?.reduce((values, module) => {
				values[module.id] = module.value;
				return values;
			}, {}) ?? {};
		const opt = {
			...options,
			...modulesValues,
			nbModules: this.nbModules,
		};
		return super.getPassiveModifier(modifierName, opt);
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
		displayError('Madness.Message.Error.NotEnoughAmmo');
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
