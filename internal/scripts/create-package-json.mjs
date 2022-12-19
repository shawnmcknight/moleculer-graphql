#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

/** Build output path */
const buildPath = path.resolve(process.cwd(), './dist');

/** Create a minimal package.json file in the build folder */
const createPackageFile = () => {
	const source = path.resolve(process.cwd(), './package.json');
	const packageFile = readFileSync(source, 'utf8');
	const { publishConfig, main, types, scripts, devDependencies, ...packageDataOther } =
		JSON.parse(packageFile);

	const newPackageData = {
		...packageDataOther,
		main: './index.js',
		types: './index.d.ts',
	};

	const minimalPackage = JSON.stringify(newPackageData, null, 2);

	const target = path.resolve(buildPath, './package.json');

	writeFileSync(target, minimalPackage, 'utf8');
	console.log(`Created package.json in ${target}`);
};

createPackageFile();
