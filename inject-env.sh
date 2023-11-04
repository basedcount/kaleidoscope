#!/bin/bash
sed -i "s/ENABLE_USER_FLAIRS/$ENABLE_USER_FLAIRS/g" /app/assets/env.js
sed -i "s/ENABLE_FEDISEER/$ENABLE_FEDISEER/g" /app/assets/env.js
sed -i "s/DISCORD_URL/$DISCORD_URL/g" /app/assets/env.js
sed -i "s/DONATION_URL/$DONATION_URL/g" /app/assets/env.js
sed -i "s/GIT_REPOSITORY/$GIT_REPOSITORY/g" /app/assets/env.js
