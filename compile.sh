#!/bin/sh
deno compile --allow-read --allow-net=deno.land --importmap=import_map.jso --output thor main.ts