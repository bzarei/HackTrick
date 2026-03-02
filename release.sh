#!/bin/bash
LIB=$1

# build
npx nx build $LIB

# rewrite workspace:* to real versions in dist/package.json
node -e "
const fs = require('fs');
const distPkg = JSON.parse(fs.readFileSync('dist/libs/$LIB/package.json'));
for (const depType of ['dependencies', 'peerDependencies']) {
  for (const [dep, ver] of Object.entries(distPkg[depType] || {})) {
    if (ver === 'workspace:*') {
      const name = dep.replace('@novx/', '');
      const depPkg = JSON.parse(fs.readFileSync('libs/' + name + '/package.json'));
      distPkg[depType][dep] = '^' + depPkg.version;
      console.log('Replaced ' + dep + ' workspace:* -> ^' + depPkg.version);
    }
  }
}
fs.writeFileSync('dist/libs/$LIB/package.json', JSON.stringify(distPkg, null, 2));
"

# publish
pnpm publish dist/libs/$LIB --no-git-checks