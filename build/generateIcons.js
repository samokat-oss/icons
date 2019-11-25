const fs = require('fs-extra');
const path = require('path');
const svgr = require('@svgr/core').default;

const template = require('./templateIcon');

const capitalizeFirstLetter = string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const getSVGFilename = filename => filename.slice(0, -4);

const isSvg = filename => filename.slice(-4) === '.svg';

const srcDirectory = './src';
const outputDirectory = './icons';

const SVGROptions = {
  icon: true,
  template,
  ext: 'tsx',
  replaceAttrValues: { '#262626': 'currentColor' },
  plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx', '@svgr/plugin-prettier'],
};

const createSvgComponents = svgFiles => {
  return Promise.all(
    svgFiles.map(async filename => {
      const data = await fs.readFile(
        path.join(srcDirectory, filename),
        'utf-8',
      );
      const filenameWithoutExt = capitalizeFirstLetter(
        getSVGFilename(filename),
      );
      const tsxFilePath = path.join(
        outputDirectory,
        `${filenameWithoutExt}.tsx`,
      );

      const transpiledIcon = await svgr(data, SVGROptions, {
        componentName: `Svg${filenameWithoutExt}`,
      });
      return await fs.writeFile(tsxFilePath, transpiledIcon);
    }),
  );
};

const createIndexFile = async (svgFiles, filepath) => {
  const files = svgFiles.map(file =>
    capitalizeFirstLetter(getSVGFilename(file)),
  );
  const importLines = files
    .map(filename => {
      return `export { default as ${filename} } from './${filename}';`;
    })
    .join('\n');

  return await fs.writeFile(filepath, importLines);
};

const clearOutput = async () => {
  await fs.remove(outputDirectory);
  await fs.mkdir(outputDirectory);
};

const generateIcons = async () => {
  await clearOutput();
  const iconFiles = await fs.readdir(srcDirectory);
  const svgFiles = iconFiles.filter(isSvg);
  await createSvgComponents(svgFiles);
  await createIndexFile(svgFiles, path.join(outputDirectory, 'index.ts'));
};

module.exports = {
  generateIcons,
};
