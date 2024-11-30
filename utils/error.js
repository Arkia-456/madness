class NaNError extends Error {
	constructor(cause) {
		super(`${cause} is NaN`);
	}
}

export { NaNError };
