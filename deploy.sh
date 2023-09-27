#!/bin/bash
set -e

new_tag="$1"

# Old deploy
# sudo docker build . --tag dessalines/lemmy-ui:$new_tag --platform=linux/amd64 --push
sudo docker build . --tag ornatot/kaleidoscope:$new_tag --platform=linux/amd64
sudo docker push ornatot/kaleidoscope:$new_tag

# New deploy - I don't know how to set this one up
# # Upgrade version
# yarn version --new-version $new_tag
# git push

# git tag $new_tag
# git push origin $new_tag
