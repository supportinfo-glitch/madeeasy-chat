// Use the package from this repository (its built `lib`), with this app's own React and React Native.
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const pkg = path.resolve(__dirname, "..");
const config = getDefaultConfig(__dirname);
config.watchFolders = [pkg];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];
config.resolver.extraNodeModules = { "@agenticauto/madeeasy-chat": pkg };
// The package's own development copies of React and React Native must never load.
config.resolver.blockList = [new RegExp(`${path.resolve(pkg, "node_modules").replace(/[/\\]/g, "[/\\\\]")}[/\\\\].*`)];
module.exports = config;
