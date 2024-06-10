import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
const defaultDataPath = process.env.FOUNDRY_DATA_PATH;
const environment = process.env.ENVIRONMENT;

const dataPath =
	environment === 'Dev'
		? defaultDataPath
		: (
				await prompts({
					type: 'text',
					name: 'path',
					format: (v) => v.trim(),
					message: `Enter the full path to your Foundry data folder. Default is: "${defaultDataPath}"`,
				})
			).path || defaultDataPath;

if (!dataPath || !/\bData$/.test(dataPath)) {
	console.error(
		`"${defaultDataPath}" does not look like a Foundry data folder`,
	);
	process.exit(1);
}

const dataPathStats = fs.lstatSync(dataPath, { throwIfNoEntry: false });
if (!dataPathStats?.isDirectory()) {
	console.error(`"${dataPath}" is not a folder`);
	process.exit(1);
}

const symlinkPath = path.resolve(dataPath, 'systems', 'madness');
const symlinkStats = fs.lstatSync(symlinkPath, { throwIfNoEntry: false });
if (symlinkStats) {
	const symlinkType = symlinkStats.isDirectory()
		? 'folder'
		: symlinkStats.isSymbolicLink()
			? 'symlink'
			: 'file';
	const overwrite =
		environment === 'Dev'
			? true
			: (
					await prompts({
						type: 'confirm',
						name: 'overwrite',
						initial: false,
						message: `A "madness" ${symlinkType} already exists in the "systems" folder. Do you want to overwrite it with new symlink?`,
					})
				).overwrite;
	if (!overwrite) {
		console.log('Aborting');
		process.exit();
	}
}

try {
	if (symlinkStats?.isDirectory()) {
		fs.rmSync(symlinkPath, { recursive: true, force: true });
	} else if (symlinkStats) {
		fs.unlinkSync(symlinkPath);
	}
	fs.symlinkSync(path.resolve(process.cwd()), symlinkPath);
} catch (error) {
	if (error instanceof Error) {
		console.error(
			`An error occurred trying to create a symlink: ${error.message}`,
		);
		process.exit(1);
	}
}
