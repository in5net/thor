#!/bin/sh
clear
deno run --allow-read --allow-net=deno.land --importmap=import_map.json main.ts code.thor $1