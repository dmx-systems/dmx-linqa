#!/bin/bash

if [ -d ./deploy/dmx/html/dmx-linqa ]; then
    mkdir ./deploy/dmx/${TIER}/instance/config/
    cp -a ./deploy/dmx/html/dmx-linqa ./deploy/dmx/${TIER}/instance/config/
fi
