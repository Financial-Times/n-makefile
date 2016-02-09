DONE = "✓ $@ done"
# Warning, don't edit this file, it's maintained on GitHub and updated by runing `make update-tools`
# Submit PR's here: https://www.github.com/Financial-Times/n-makefile

#
# META TASKS
#

update-tools:
	$(eval LATEST := $(shell curl -s https://api.github.com/repos/Financial-Times/n-makefile/tags | grep name | head -n 1 | sed 's/[," ]//g' | cut -d : -f 2))
	@curl -sL https://raw.githubusercontent.com/Financial-Times/n-makefile/$(LATEST)/Makefile > n.Makefile
	@echo "Updated tools to $(LATEST). Please now run:-"
	@echo 'git add n.Makefile; git commit -am "Updated n.Makefile to $(LATEST); git push'
	@echo $(DONE)

#
# COMMON TASKS
#

clean:
	git clean -fxd

install: node_modules
	@for n in $(shell ls functions 2>/dev/null); do $(MAKE) functions/$$n/node_modules; done
	@echo $(DONE)

deploy:
	@$(MAKE) _apex_deploy

#
# SUB-TASKS
#

# INSTALL SUB-TASKS

# Regular npm install
node_modules:
	@if [ -e package.json ]; then npm prune --production=false && npm install && echo $(DONE); fi

# node_modules for Lambda functions
functions/%/node_modules:
	@cd $(shell dirname $@) && if [ -e package.json ]; then npm prune --production=false && npm install && echo $(DONE); fi


# DEPLOY SUB-TASKS
_apex_deploy:
	@# TODO: put the logic from curl into this repo
	@if [ -e project.json ]; then apex deploy `curl -sL https://gist.githubusercontent.com/matthew-andrews/1da58dc5f931499a91d0/raw | bash -` && echo $(DONE); fi
