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

/**
 * Calls a defined callback function on each element of an object, and returns an object that contains the results.
 * @param {object} obj object to map
 * @param {Function} callback A function to execute for each element of the object. Its return value is added as a single element in the new object, with the same key as original. The function is called with the following arguments:
 * - element: the current element being processed in the object
 * - key: the key of the current element being processed in the object
 * - index: the index of the current element being processed in the object
 * @returns A new object with each element being the result of the callback function
 */
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
