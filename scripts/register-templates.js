export function registerTemplates() {
	const paths = getPartials();
	loadTemplates(paths);
}

const templatesPath = 'systems/madness/templates';

const getPartials = () => {
	const paths = {};
	const appPartials = {
		actor: ['character', 'navbar'],
		item: ['effect-line'],
	};
	Object.entries(appPartials).forEach(([category, partials]) => {
		partials.forEach((partial) => {
			paths[`madness.${category}.${partial}`] =
				`${templatesPath}/${category}/partials/${partial}.hbs`;
		});
	});
	return paths;
};
