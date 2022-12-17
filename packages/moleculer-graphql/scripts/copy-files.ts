import path from 'path';
import fse from 'fs-extra';

/** Build output path */
const buildPath = path.resolve(process.cwd(), './dist');

/** Create a minimal package.json file in the build folder */
const createPackageFile = async (): Promise<void> => {
	const source = path.resolve(process.cwd(), './package.json');
	const packageFile = await fse.readFile(source, 'utf8');
	const { publishConfig, main, types, scripts, devDependencies, ...packageDataOther } =
		JSON.parse(packageFile);

	const newPackageData = {
		...packageDataOther,
		private: false,
		main: './index.js',
		types: './index.d.ts',
	};

	const minimalPackage = JSON.stringify(newPackageData, null, 2);

	const target = path.resolve(buildPath, './package.json');

	await fse.writeFile(target, minimalPackage, 'utf8');
	console.log(`Created package.json in ${target}`);
};

/** Copy the specified static asset folder to the build folder */
const copyStaticAssetFolder = async (folderName: string): Promise<void> => {
	const source = path.resolve(process.cwd(), './src', folderName);
	const target = path.resolve(buildPath, folderName);

	await fse.copy(source, target);
	console.log(`Successfully copied static assets from ${source} to ${target}`);
};

/** Copy static assets to build folder */
const copyStaticAssets = async (): Promise<void> => {
	const staticAssetsFolders = ['./playground'] as const;

	await Promise.all(staticAssetsFolders.map((folderName) => copyStaticAssetFolder(folderName)));

	console.log('Successfully copied all static assets');
};

/** Copy the specified file to the build folder */
const copyFile = async (fileName: string): Promise<void> => {
	const target = path.resolve(buildPath, fileName);
	await fse.copy(fileName, target);

	console.log(`Copied ${fileName} to ${buildPath}`);
};

/** Copy meta files to build folder */
const copyMeta = async (): Promise<void> => {
	const filesToCopy = ['README.md'] as const;

	await Promise.all(filesToCopy.map((fileName) => copyFile(fileName)));

	console.log('Successfully copied all meta files');
};

// launch copy tasks
Promise.all([copyStaticAssets(), copyMeta(), createPackageFile()])
	.then(() => {
		console.log('All files copied successfully');
	})
	.catch((err) => {
		console.error('Error copying files', err);
		process.exit(1);
	});
