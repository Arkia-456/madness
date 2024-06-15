function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function elide(strToElide, str) {
	const regex = /^[aieouâêîôûäëïöüàéèùœ].*/i;
	return regex.test(str) ? strToElide.replace(/.$/, "'") : `${strToElide} `;
}

export { capitalizeFirstLetter, elide };
