#!/bin/sh
deno run --inspect-brk --allow-all --importmap=import_map.jso main.ts code.thor $1