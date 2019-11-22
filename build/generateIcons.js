const fs = require('fs-extra');
const path = require('path');
const svgr = require('@svgr/core').default;

const template = require('./templateIcon');

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const createSvgComponents = (svgFiles) => {
  return Promise.all(svgFiles.map(async filename => {
    const data = await fs.readFile(path.join('./icons', filename), 'utf-8');
    const filenameWithoutExt = capitalizeFirstLetter(filename.slice(0, -4));
    const tsxFilePath = path.join('./src', `${filenameWithoutExt}.tsx`);
    const transpiledIcon = await svgr(data, { icon: true, template, ext: "tsx", replaceAttrValues: { '#262626': 'currentColor'},  plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx', '@svgr/plugin-prettier']}, { componentName: `Svg${filenameWithoutExt}` })
    return await fs.writeFile(tsxFilePath, transpiledIcon);
  }));
}

const createIndexFile = async (svgFiles, filepath) => {
  const files = svgFiles.map(file => capitalizeFirstLetter(file.slice(0, -4)))
  const importLines = files.map(filename => {
    return `export { default as ${filename} } from './${filename}';`
  }).join('\n');


  return await fs.writeFile(filepath, importLines);
}

const generateIcons = async () => {
  const srcDirectory = './src';
  const iconsDirectory = './icons'
  await fs.remove(srcDirectory);
  await fs.mkdir(srcDirectory);
  const iconFiles = await fs.readdir(iconsDirectory);
  const svgFiles = iconFiles.filter(filename => filename.slice(-4) === '.svg');
  await createSvgComponents(svgFiles)
  await createIndexFile(svgFiles, path.join('./src', 'index.ts'));
}

module.exports = {
  generateIcons,
}