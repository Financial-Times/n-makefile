# Warning, don't edit this file, it's maintained on GitHub and updated by runing `make update-tools`
# Submit PR's here: https://www.github.com/Financial-Times/n-makefile

# STYLE NOTES
# -----------
#
# Two main types of tasks.  Common and sub.
#
# Common tasks are the public facing API of the Makefile.  Developers/CI should run these commands.
# Sub-tasks are the inner, private workings of n-makefile.  Developers/CI ought not to run these commands.
#
# Type specific conventions
#
# - For ‘common’ tasks
#     - if we permit the task to be overwritten it may end with % instead of its final letter, allowing it
#       to be overwritten without producing warnings. (this is a hack, of course, and means we have to be
#       careful about how we name our common tasks!)
#     - by convention, app/component Makefiles make call commontaskname-super from inside their override
#       to run the parent common task functionality.
# - For sub-tasks
#     - name must match the directory name they generate, if they generate a directory
#     - otherwise, snake_case_is_used with a `_` prefix
#     - the name should match the pattern _commontaskname_subtaskname.  E.g. _install_scss_lint
#
# All task conventions
#
# Try to end each command with a friendly `@$(DONE)`
#
# For npm dev dependencies, assume they're there (hope that the devDependencies bring them), optionally
# warn the developer to install them.  Don't try to install them from here.
#
# Scss-lint is a special case because Ruby.  That is allowed to be installed here but let's try to avoid
# doing that unless we absolutely have to.

#
# META TASKS
#

.PHONY: test

#
# COMMON TASKS
#

# clean
clea%:
	@git clean -fxd
	@$(DONE)

# install
instal%: node_modules bower_components _install_scss_lint .editorconfig .eslintrc.json .scss-lint.yml .env
	@$(MAKE) $(foreach f, $(shell find functions/* -type d -maxdepth 0 2>/dev/null), $f/node_modules)
	@$(DONE)

# deploy
deplo%: _deploy_apex
	@$(DONE)

# verify
verif%: _verify_lintspaces _verify_eslint _verify_scss_lint
	@$(DONE)

#
# SUB-TASKS
#

# INSTALL SUB-TASKS

# Regular npm install
node_modules:
	@if [ -e package.json ]; then $(NPM_INSTALL) && $(DONE); fi

# Regular bower install
bower_components:
	@if [ -e bower.json ]; then bower install --config.registry.search=http://registry.origami.ft.com --config.registry.search=https://bower.herokuapp.com && $(DONE); fi

# node_modules for Lambda functions
functions/%/node_modules:
	@cd $(dir $@) && if [ -e package.json ]; then $(NPM_INSTALL) && $(DONE); fi

_install_scss_lint:
	@if [ ! -x "$(shell which scss-lint)" ] && [ "$(call GLOB, '*.scss')" != "" ]; then gem install scss-lint -v 0.35.0 && $(DONE); fi

# Manage the .editorconfig, .eslintrc.json and .scss-lint files if they're in the .gitignore
.editorconfig .eslintrc.json .scss-lint.yml:
	@if $(call IS_GIT_IGNORED); then curl -sL https://raw.githubusercontent.com/Financial-Times/n-makefile/$(VERSION)/config/$@ > $@ && $(DONE); fi

.env:
	@if $(call IS_GIT_IGNORED) && [ -e package.json ]; then $(call CONFIG_VARS, development, $(call APP_NAME)) > .env && $(DONE); fi

# VERIFY SUB-TASKS

_verify_eslint:
	@if [ -e .eslintrc.json ]; then $(NPM_BIN_ENV) && eslint $(call GLOB, '*.js') && $(DONE); fi

_verify_lintspaces:
	@if [ -e .editorconfig ] && [ -e package.json ]; then $(NPM_BIN_ENV) && lintspaces -e .editorconfig -i js-comments,html-comments $(call GLOB) && $(DONE); fi

_verify_scss_lint:
	@if [ -e .scss-lint.yml ]; then scss-lint -c ./.scss-lint.yml $(call GLOB, '*.scss') && $(DONE); fi

# DEPLOY SUB-TASKS

_deploy_apex:
	@if [ -e project.json ]; then apex deploy `$(call CONFIG_VARS, production, $(call APP_NAME)) | sed 's/\(.*\)/-e \1/' | tr '\n' ' '` && $(DONE); fi

# Some handy utilities
GLOB = $(shell git ls-files $1)
NPM_INSTALL = npm prune --production && npm install
JSON_GET_VALUE = grep $1 | head -n 1 | sed 's/[," ]//g' | cut -d : -f 2
IS_GIT_IGNORED = grep -q $(if $1, $1, $@) .gitignore
VERSION = master
APP_NAME = $(shell cat package.json 2>/dev/null | $(call JSON_GET_VALUE, name))
DONE = echo ✓ $@ done
NPM_BIN_ENV = export PATH="$$PATH:node_modules/.bin"
CONFIG_VARS = curl -sL https://ft-next-config-vars.herokuapp.com/$(strip $1)/$(strip $2).env -H "Authorization: `heroku config:get APIKEY --app ft-next-config-vars`"

# UPDATE TASK

update-tools:
	$(eval LATEST = $(shell curl -s https://api.github.com/repos/Financial-Times/n-makefile/tags | $(call JSON_GET_VALUE, name)))
	$(if $(filter $(LATEST), $(VERSION)), $(error Cannot update n-makefile, as it is already up to date!))
	@curl -sL https://raw.githubusercontent.com/Financial-Times/n-makefile/$(LATEST)/Makefile > n.Makefile
	@sed -i "" "s/^VERSION = master/VERSION = $(LATEST)/" n.Makefile
	@read -p "Updated tools from $(VERSION) to $(LATEST).  Do you want to commit and push? [y/N] " Y;\
	if [ $$Y == "y" ]; then git add n.Makefile && git commit -m "Updated tools to $(LATEST)" && git push; fi
	@$(DONE)
