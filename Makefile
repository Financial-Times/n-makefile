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
#     - name must match the directory name they generate
#     - if we permit the task to be overwritten it may end with % instead of its
#       final letter, allowing it to be overwritten without producing warnings.
#       (this is a hack, of course!)
# - For sub-tasks
#     - snake_case_is_used
#     - should always start with a `_`
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

update-tools:
	$(eval LATEST := $(shell curl -s https://api.github.com/repos/Financial-Times/n-makefile/tags | grep name | head -n 1 | sed 's/[," ]//g' | cut -d : -f 2))
	@curl -sL https://raw.githubusercontent.com/Financial-Times/n-makefile/$(LATEST)/Makefile > n.Makefile
	@echo "Updated tools to $(LATEST). Please now run:-"
	@echo 'git add n.Makefile; git commit -am "Updated n.Makefile to $(LATEST); git push'
	@echo $(DONE)

#
# COMMON TASKS
#

# clean
clea%:
	git clean -fxd

# install
instal%: node_modules bower_components _install_scss_lint
	@for n in $(shell ls functions 2>/dev/null); do $(MAKE) functions/$$n/node_modules; done
	@echo $(DONE)

# deploy
deplo%:
	@$(MAKE) _deploy_apex

# coverage
coverag%:
	@open coverage/lcov-report/index.html

# verify
verif%:
	$(eval JS_FILES := $(shell find . -name '*.js' ! -path '*/node_modules/*' ! -path './.git/*' ! -path './coverage/*'))
	@if [ "$(JS_FILES)" != "" ]; then eslint $(JS_FILES); fi

#
# SUB-TASKS
#

# INSTALL SUB-TASKS

# Regular npm install
node_modules:
	@if [ -e package.json ]; then npm prune --production=false && npm install && echo $(DONE); fi

# Regular bower install
bower_components:
	@if [ -e bower.json ]; then bower install && echo $(DONE); fi

# node_modules for Lambda functions
functions/%/node_modules:
	@cd $(shell dirname $@) && if [ -e package.json ]; then npm prune --production=false && npm install && echo $(DONE); fi

# It would be nice if this only installed if we found at least one *.scss file in the repo
_install_scss_lint:
	@if hash scss-lint 2>/dev/null; then printf ""; else gem install scss_lint && echo $(DONE); fi

# DEPLOY SUB-TASKS
_deploy_apex:
	@# TODO: put the logic from curl into this repo
	@if [ -e project.json ]; then apex deploy `curl -sL https://gist.githubusercontent.com/matthew-andrews/1da58dc5f931499a91d0/raw | bash -` && echo $(DONE); fi
