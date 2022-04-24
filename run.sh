#!/bin/sh
clear
deno run --allow-read --allow-net=deno.land --import-map=import_map.json main.ts code.thor $1