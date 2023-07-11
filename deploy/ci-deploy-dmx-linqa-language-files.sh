#!/bin/bash

if [ -d ./deploy/dmx/html/dmx-linqa ]; then
    mkdir -p ./deploy/instance/${TIER}/conf/
    cp -a ./deploy/dmx/html/dmx-linqa ./deploy/instance/${TIER}/conf/
fi
