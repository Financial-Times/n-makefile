DONE = "✓ $@ done"
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
# Try to end each command with a friendly `@echo $(DONE)`
#
# For npm dev dependencies, assume they're there (hope that the devDependencies bring them), optionally
# warn the developer to install them.  Don't try to install them from here.
#
# Scss-lint is a special case because Ruby.  That is allowed to be installed here but let's try to avoid
# doing that unless we absolutely have to.

#
# META TASKS
#

.PHONY: coverage test

#
# COMMON TASKS
#

# clean
clea%:
	@git clean -fxd
	@echo $(DONE)

# install
instal%: node_modules bower_components _install_scss_lint .editorconfig
	@$(MAKE) $(foreach f, $(shell find functions/* -type d -maxdepth 0 2>/dev/null), $f/node_modules)
	@echo $(DONE)

# deploy
deplo%:
	@$(MAKE) _deploy_apex
	@echo $(DONE)

# coverage
coverag%:
	@open coverage/lcov-report/index.html
	@echo $(DONE)

# verify
verif%: _verify_lintspaces _verify_eslint
	@if [ -e Procfile ] && ! $(call IS_GIT_IGNORED, ".env"); then echo "Heroku apps must have .env in their .gitignore" && false; fi
	@echo $(DONE)

#
# SUB-TASKS
#

# INSTALL SUB-TASKS

# Regular npm install
node_modules:
	@if [ -e package.json ]; then $(NPM_INSTALL) && echo $(DONE); fi

# Regular bower install
bower_components:
	@if [ -e bower.json ]; then bower install --config.registry.search=http://registry.origami.ft.com --config.registry.search=https://bower.herokuapp.com && echo $(DONE); fi

# node_modules for Lambda functions
functions/%/node_modules:
	@cd $(dir $@) && if [ -e package.json ]; then $(NPM_INSTALL) && echo $(DONE); fi

_install_scss_lint:
	@if [ ! -x "$(shell which scss-lint)" ] && [ "$(call GLOB, *.scss)" != "" ]; then gem install scss_lint && echo $(DONE); fi

# Manage the .editorconfig file if it's in the .gitignore
.editorconfig:
	@if $(call IS_GIT_IGNORED, ".editorconfig"); then curl -s https://raw.githubusercontent.com/Financial-Times/n-makefile/master/.editorconfig > .editorconfig && echo $(DONE); fi

# VERIFY SUB-TASKS

_verify_eslint:
	$(eval JS_FILES = $(call GLOB, '*.js'))
	@if [ "$(JS_FILES)" != "" ]; then eslint $(JS_FILES) && echo $(DONE); fi

_verify_lintspaces:
	@if [ -e .editorconfig ] && [ -e package.json ]; then find . -type f ! -name "*.swp" ! -path '*/node_modules/*' ! -path './.git/*' ! -path './coverage/*' ! -path '*/bower_components/*' -exec lintspaces -e .editorconfig -i js-comments,html-comments {} + && echo $(DONE); fi

# DEPLOY SUB-TASKS

_deploy_apex:
	@# TODO: put the logic from curl into this repo
	@if [ -e project.json ]; then apex deploy `curl -sL https://gist.githubusercontent.com/matthew-andrews/1da58dc5f931499a91d0/raw | bash -` && echo $(DONE); fi

# Some handy utilities
GLOB = $(shell find . -name $(1) ! -path '*/node_modules/*' ! -path './.git/*' ! -path './coverage/*' ! -path '*/bower_components/*')
NPM_INSTALL = npm prune --production && npm install
IS_GIT_IGNORED = grep -q $1 .gitignore

# Update task
update-tools:
	$(eval LATEST = $(shell curl -s https://api.github.com/repos/Financial-Times/n-makefile/tags | grep name | head -n 1 | sed 's/[," ]//g' | cut -d : -f 2))
	@curl -sL https://raw.githubusercontent.com/Financial-Times/n-makefile/$(LATEST)/Makefile > n.Makefile
	@read -p "Updated tools to $(LATEST).  Do you want to commit and push? [y/N] " Y;\
	if [ $$Y == "y" ]; then git add n.Makefile && git commit -m "Updated tools to $(LATEST)" && git push; fi
	@echo $(DONE)
