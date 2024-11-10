function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

function elide(strToElide, str) {
	const regex = /^[aieouâêîôûäëïöüàéèùœ].*/i;
	return regex.test(str) ? strToElide.replace(/.$/, "'") : `${strToElide} `;
}

function isEmptyObject(obj) {
	for (const prop in obj) {
		return false;
	}
	return true;
}

function objectMap(obj, callback) {
	return Object.fromEntries(
		Object.entries(obj).map(([key, value], index) => [
			key,
			callback(value, key, index),
		]),
	);
}

function uncapitalizeFirstLetter(string) {
	return string.charAt(0).toLowerCase() + string.slice(1);
}

export {
	capitalizeFirstLetter,
	elide,
	isEmptyObject,
	objectMap,
	uncapitalizeFirstLetter,
};
