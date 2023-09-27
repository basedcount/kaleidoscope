#!/bin/bash
set -e

sudo docker build . --tag ornatot/kaleidoscope:dev
sudo docker push ornatot/kaleidoscope:dev
