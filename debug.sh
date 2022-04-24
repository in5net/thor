#!/bin/sh
deno run --inspect-brk --allow-all --import-map=import_map.jso main.ts code.thor $1