#!/bin/sh
deno compile --allow-read --allow-net=deno.land --import-map=import_map.jso --output thor main.ts