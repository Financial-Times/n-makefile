# Warning, don't edit this file, it's maintained on GitHub and updated by running `make update-tools`
# Submit PR's here: https://www.github.com/Financial-Times/n-makefile


# ./node_modules/.bin on the PATH
export PATH := ./node_modules/.bin:$(PATH)

# Use bash not sh
SHELL := /bin/bash

#
# META TASKS
#

.PHONY: test

#
# COMMON TASKS
#

# clean
clea%:
# HACK: Can't use -e option here because it's not supported by our Jenkins
	@git clean -fxd
	@$(DONE)

# install
instal%: node_modules bower_components _install_scss_lint .editorconfig .eslintrc.json .scss-lint.yml .env webpack.config.js
	@$(MAKE) $(foreach f, $(shell find functions/* -type d -maxdepth 0 2>/dev/null), $f/node_modules)
	@$(DONE)

# deploy
deplo%: _deploy_apex
	@$(DONE)

# verify
verif%: _verify_lintspaces _verify_eslint _verify_scss_lint
	@$(DONE)

# build (includes build-production)
buil%:
	@$(warning WARNING: Work in progress, build-production does not yet minify or prepare tarballs for Heroku.  Use with caution.)
	@if [ -e webpack.config.js ]; then webpack $(if $(findstring build-production,$@),--bail,--dev); fi
	@$(DONE)

# watch
watc%:
	@if [ -e webpack.config.js ]; then webpack --watch; fi
	@$(DONE)

#
# SUB-TASKS
#

# INSTALL SUB-TASKS

# Regular npm install
node_modules: package.json
	@if [ -e package.json ]; then $(NPM_INSTALL) && $(DONE); fi

# Regular bower install
bower_components: bower.json
	@if [ -e bower.json ]; then bower install --config.registry.search=http://registry.origami.ft.com --config.registry.search=https://bower.herokuapp.com && $(DONE); fi

# These tasks have been intentionally left blank
package.json:
bower.json:

# node_modules for Lambda functions
functions/%/node_modules:
	@cd $(dir $@) && if [ -e package.json ]; then $(NPM_INSTALL) && $(DONE); fi

_install_scss_lint:
	@if [ ! -x "$(shell which scss-lint)" ] && [ "$(shell $(call GLOB,'*.scss'))" != "" ]; then gem install scss-lint -v 0.35.0 && $(DONE); fi

# Manage the .editorconfig, .eslintrc.json and .scss-lint files if they're in the .gitignore
.editorconfig .eslintrc.json .scss-lint.yml webpack.config.js:
	@if $(call IS_GIT_IGNORED); then curl -sL https://raw.githubusercontent.com/Financial-Times/n-makefile/$(VERSION)/config/$@ > $@ && $(DONE); fi

.env:
	@if $(call IS_GIT_IGNORED) && [ -e package.json ]; then $(call CONFIG_VARS,development) > .env && $(DONE); fi

# VERIFY SUB-TASKS

_verify_eslint:
	@if [ -e .eslintrc.json ]; then $(call GLOB,'*.js') | xargs eslint && $(DONE); fi

_verify_lintspaces:
	@if [ -e .editorconfig ] && [ -e package.json ]; then $(call GLOB) | xargs lintspaces -e .editorconfig -i js-comments,html-comments && $(DONE); fi

_verify_scss_lint:
# HACK: Use backticks rather than xargs because xargs swallow exit codes (everything becomes 1 and stoopidly scss-lint exits with 1 if warnings, 2 if errors)
	@if [ -e .scss-lint.yml ]; then { scss-lint -c ./.scss-lint.yml `$(call GLOB,'*.scss')`; if [ $$? -ne 0 -a $$? -ne 1 ]; then exit 1; fi; $(DONE); } fi

# DEPLOY SUB-TASKS

_deploy_apex:
	@if [ -e project.json ]; then $(call CONFIG_VARS,production) | sed 's/\(.*\)/-e \1/' | tr '\n' ' ' | xargs apex deploy && $(DONE); fi

# Some handy utilities
GLOB = git ls-files $1
NPM_INSTALL = npm prune --production=false && npm install
JSON_GET_VALUE = grep $1 | head -n 1 | sed 's/[," ]//g' | cut -d : -f 2
IS_GIT_IGNORED = grep -q $(if $1, $1, $@) .gitignore
VERSION = master
APP_NAME = $(shell cat package.json 2>/dev/null | $(call JSON_GET_VALUE,name))
DONE = echo ✓ $@ done
CONFIG_VARS = curl -sL https://ft-next-config-vars.herokuapp.com/$1/$(if $2,$2,$(call APP_NAME)).env -H "Authorization: `heroku config:get APIKEY --app ft-next-config-vars`"

# UPDATE TASK

update-tools:
	$(eval LATEST = $(shell curl -s https://api.github.com/repos/Financial-Times/n-makefile/tags | $(call JSON_GET_VALUE,name)))
	$(if $(filter $(LATEST), $(VERSION)), $(error Cannot update n-makefile, as it is already up to date!))
	@curl -sL https://raw.githubusercontent.com/Financial-Times/n-makefile/$(LATEST)/Makefile > n.Makefile
	@sed -i "" "s/^VERSION = master/VERSION = $(LATEST)/" n.Makefile
	@read -p "Updated tools from $(VERSION) to $(LATEST).  Do you want to commit and push? [y/N] " Y;\
	if [ $$Y == "y" ]; then git add n.Makefile && git commit -m "Updated tools to $(LATEST)" && git push; fi
	@$(DONE)
