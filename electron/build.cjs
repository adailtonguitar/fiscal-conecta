const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pkgPath = path.join(__dirname, '..', 'package.json');
const backup = fs.readFileSync(pkgPath, 'utf-8');

try {
  // Temporarily remove "type": "module" so Electron can load .cjs files
  const pkg = JSON.parse(backup);
  delete pkg.type;
  pkg.main = 'electron/main.cjs';
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log('✅ Removed "type": "module" from package.json temporarily');

  execSync('npx electron-builder --config electron-builder.config.json', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' }
  });
} finally {
  // Always restore original package.json
  fs.writeFileSync(pkgPath, backup);
  console.log('✅ Restored original package.json');
}
