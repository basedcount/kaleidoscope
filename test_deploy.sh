#!/bin/bash
set -e

sudo docker build . --tag ornatot/kaleidoscope:dev
docker push ornatot/kaleidoscope:dev
