#!/bin/sh
cd vscode/
yarn run build
rm -R $HOME/.vscode/extensions/thor/
cp -R ./ $HOME/.vscode/extensions/thor/