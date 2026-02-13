const fs = require('fs');
const path = require('path');

exports.default = async function(context) {
  // Fix the packaged package.json to remove "type": "module"
  const appDir = context.packager.getResourcesDir(context.appOutDir);
  const appAsarUnpacked = path.join(appDir, 'app');
  
  // For asar packages, we need to modify before packing
  const pkgPath = path.join(context.packager.projectDir, 'package.json');
  const appPkgPath = path.join(appDir, 'app', 'package.json');
  
  // Try to find and fix package.json in the output
  const possiblePaths = [
    appPkgPath,
    path.join(context.appOutDir, 'resources', 'app', 'package.json'),
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      const pkg = JSON.parse(fs.readFileSync(p, 'utf-8'));
      delete pkg.type; // Remove "type": "module"
      pkg.main = 'electron/main.cjs';
      fs.writeFileSync(p, JSON.stringify(pkg, null, 2));
      console.log(`Fixed package.json at: ${p}`);
    }
  }
};
