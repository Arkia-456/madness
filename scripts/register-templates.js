export function registerTemplates() {
	const paths = getPartials();
	loadTemplates(paths);
}

const templatesPath = 'systems/madness/templates';

const getPartials = () => {
	const paths = {};
	const appPartials = {
		actor: ['actions', 'character', 'inventory', 'notes', 'status', 'navbar'],
		item: ['effect-line'],
	};
	Object.entries(appPartials).forEach(([category, partials]) => {
		partials.forEach((partial) => {
			paths[`madness.${category}.${partial}`] =
				`${templatesPath}/${category}/partials/${partial}.hbs`;
		});
	});

	const detailsTypes = [
		'effect',
		'equipment',
		'ethnicity',
		'skill',
		'spell',
		'weapon',
	];
	detailsTypes.forEach(
		(type) =>
			(paths[`madness.item.${type}.details`] =
				`${templatesPath}/item/${type}/details.hbs`),
	);

	paths['madness.partials.passives'] = `${templatesPath}/partials/passives.hbs`;

	return paths;
};
