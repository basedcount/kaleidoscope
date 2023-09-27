# Kaleidoscope

Kaleidoscope is a fork and expansion of the official [lemmy-ui](https://github.com/LemmyNet/lemmy-ui) project.

While this fork is mostly built for our own instance, we built it in the most modular and re-usable way possible, by tying each one of our additional features to a switch controlled by [environment varialbes](#configuration). Admins can selectively turn on and off all of the Kaleidoscope extra features, according to their needs and preferences.

# Features
### User flairs
This is the big one. Thanks to our very own [flair](https://github.com/basedcount/flair) Rust microservice, we integrate a Reddit-like user flair systems.  
Community moderators may opt in to the system by adding user flairs to their community, at which point a flair picker will be displayed in the commuity sidebar.

A user's flair will appear in the sidebar, as well as near their comments and posts. Mods may also add restricted, mod only flairs.

### Fediseer
[Fediseer](https://gui.fediseer.com/glossary) is an awesome service that aims at solving some of the security issues brought by the federation systems. It attempts to provide a community sourced classification of instances that are spam or other kinds of bad actors, as well as giving admins the possibility to voice their approval or disapproval of other instances, without necessarily resorting to blocking them.

Kaleidoscope further enhances this principle by displaying badges next to comments and post by federated actors, detailing whether their instance is guaranteed by a Fediseer admin and, if any, how their admin has classified them (endorsement, censure, hesitation).

Furthermore, users wishing to protect their experience can selectively hide content coming from untrusted actors.

### Better error messages
Error pages have been redesigned for a clearer user experience. If the appropriate environment variable is set, they will contain an invite link to the instance's Discord server for non technical users who might have difficulty using Matrix.

Additionally, the list of the admins' Matrix account has been re-styled to add additional context on who the contactable admins are, as well as providing a link to their Matrix accounts.

### Discord
Admins may add an invite link to a Discord server, to be included in the newly designed error pages as well as in the site's footer.

While Matrix remains unquestionably better for privacy reasons, few users and administrators use it. Discord remains the platform of choice for community chatrooms, especially among non-technical users.

### Custom donation link
Admins looking for funding may add a custom donation link, to be injected in replacement of the default Lemmy one contained in the page navbar.

### Custom link to git repository
Admins running custom software may add a custom GitHub (or any other git host) link, to be injected in the "Code" section of the footer.

# Limitations
None of these features include support for translation, which is otherwise supported in Lemmy. Where possible the existing Lemmy translation were recycled, however some fragments of the UI are exclusively available in English.

For users viewing the site in any language other than English, this will result in a partially bilingual page.

# Configuration

Being a lemmy-ui fork, Kaleidoscope expands the already existing config options. Because of this, all of the [lemmy-ui environment variables](https://github.com/LemmyNet/lemmy-ui#configuration) remain supported.

The following additional environment variables can be used to configure the extra features provided by Kaleidoscope:

| `ENV_VAR`                      | type     | default          | description                                                                         |
| ------------------------------ | -------- | ---------------- | ----------------------------------------------------------------------------------- |
| `ENABLE_USER_FLAIRS`                | `bool` | `false`   | If true the instance will poll a local [flair](https://github.com/basedcount/flair) API looking for [user flairs](#user-flairs).                |
| `ENABLE_FEDISEER` | `bool` | `true`   | Whether to enable the [Fediseer](#fediseer) support options. |
| `DISCORD_URL` | `string` | `undefined`   | If set, a Discord invite link will be included in the footer and in the redesigned error pages.                 |
| `DONATION_URL`               | `string`   | `undefined`          | If set, it will replace the Lemmy donation link in the navbar.                                                              |
| `GIT_REPOSITORY` | `string` | `undefined` | If set, it will replace the link to the Lemmy repository in the footer.                                        |
