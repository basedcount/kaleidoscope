FROM node:21-alpine as builder

# Added vips-dev and pkgconfig so that local vips is used instead of prebuilt
# Done for two reasons:
# - libvips binaries are not available for ARM32
# - It can break depending on the CPU (https://github.com/LemmyNet/lemmy-ui/issues/1566)
RUN apk update && apk upgrade && apk add --no-cache curl yarn python3 build-base gcc wget git vips-dev pkgconfig

# Install node-gyp
RUN npm install -g node-gyp

WORKDIR /usr/src/app

ENV npm_config_target_platform=linux
ENV npm_config_target_libc=musl

# Cache deps
COPY package.json yarn.lock ./

RUN yarn --production --prefer-offline --pure-lockfile --network-timeout 100000

# Build
COPY generate_translations.js \
  tsconfig.json \
  webpack.config.js \
  .babelrc \
  ./

COPY lemmy-translations lemmy-translations
COPY src src
COPY .git .git

# Set UI version 
RUN echo "export const VERSION = 'Kaleidoscope $(git describe --tag)';" > "src/shared/version.ts"

RUN yarn --production --prefer-offline --network-timeout 100000
RUN yarn build:prod

RUN rm -rf ./node_modules/import-sort-parser-typescript
RUN rm -rf ./node_modules/typescript
RUN rm -rf ./node_modules/npm

RUN du -sh ./node_modules/* | sort -nr | grep '\dM.*'

FROM node:21-alpine as runner
ENV NODE_ENV=production

RUN apk update && apk add --no-cache curl vips-cpp && rm -rf /var/cache/apk/*

COPY --from=builder /usr/src/app/dist /app/dist
COPY --from=builder /usr/src/app/node_modules /app/node_modules

# Copy the script
COPY inject-env.sh /app/inject-env.sh
# Make it executable
RUN chmod +x /app/inject-env.sh

RUN chown -R node:node /app

LABEL org.opencontainers.image.authors="ornato-t"
LABEL org.opencontainers.image.source="https://github.com/basedcount/kaleidoscope"
LABEL org.opencontainers.image.licenses="AGPL-3.0-or-later"
LABEL org.opencontainers.image.description="An enhanced fork of the lemmy-ui, curated by the Based Count team."

HEALTHCHECK --interval=60s --start-period=10s --retries=2 --timeout=10s CMD curl -ILfSs http://localhost:1234/ > /dev/null || exit 1

USER node
EXPOSE 1234
WORKDIR /app
CMD ./inject-env.sh && node dist/js/server.js
