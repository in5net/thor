#!/bin/sh
cd vscode/
pnpm run build
rm -R $HOME/.vscode/extensions/thor/
cp -R ./ $HOME/.vscode/extensions/thor/