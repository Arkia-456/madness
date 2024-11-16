import { displayError, Formula } from '../../../utils/index.js';
import { SkillMadness } from '../skill/index.js';

class WeaponMadness extends SkillMadness {
	get nbModules() {
		return Object.values(this.system.modules).filter((el) => el.id).length;
	}

	// Add a button to edit the item sheet to set back the check
	get reloadable() {
		return this.useAmmo && (this.nonReloadable ? this.system.allowReload : 1);
	}

	get nonReloadable() {
		return this.passives.some((p) => p.name === 'nonReloadable');
	}

	get tooltip() {
		const data = {
			...super.tooltip,
			modules: this._modulesTooltip,
		};
		return data;
	}

	get _modulesTooltip() {
		return Object.values(this.system.modules).reduce((modules, m) => {
			if (m.id) {
				const moduleConfig = foundry.utils.deepClone(
					CONFIG.Madness.modules[m.id],
				);
				modules[m.id] = moduleConfig;
				if (moduleConfig.effects) {
					modules[m.id].effects = moduleConfig.effects.map((e) => {
						let value;
						if (e.formula) {
							value = new Formula(e.formula).evaluate({
								[m.id]: m.value,
								nbModules: this.nbModules,
							}).evaluated;
						}
						return {
							name: e.name,
							value: isNaN(value) ? '' : value,
						};
					});
				}
			}
			return modules;
		}, {});
	}

	get useAmmo() {
		return !this.passives.some((p) => p.name === 'noAmmo');
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
				values[module.id] = module.value ?? 0;
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
		const updates = { 'system.ammo.value': this.system.ammo.max };
		if (this.nonReloadable) updates['system.allowReload'] = false;
		this.update(updates);
	}

	async roll(options = {}) {
		return super.roll({
			...options,
			rollType: 'weapon',
			removeResources: true,
		});
	}

	checkBeforeRoll() {
		if (!this.useAmmo || this.checkAmmo()) return true;
		displayError('Madness.Message.Error.NotEnoughAmmo');
		return false;
	}

	removeResources() {
		if (this.useAmmo) this.removeAmmo();
	}

	checkAmmo() {
		return this.system.ammo.value > 0;
	}

	addAmmo() {
		this.update({
			'system.ammo.value': Math.min(
				this.system.ammo.value + 1,
				this.system.ammo.max,
			),
		});
	}

	removeAmmo() {
		this.update({
			'system.ammo.value': Math.max(0, this.system.ammo.value - 1),
		});
	}
}

export { WeaponMadness };
