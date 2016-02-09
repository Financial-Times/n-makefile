# Warning, don't edit this file, it's maintained on GitHub and updated by runing `make update-tools`
# Submit PR's here: https://www.github.com/Financial-Times/n-makefile

update-tools:
	@printf "Hold on…"
	$(eval LATEST := $(shell curl -s https://api.github.com/repos/Financial-Times/n-makefile/tags | grep name | head -n 1 | sed 's/[," ]//g' | cut -d : -f 2))
	@curl -sL https://raw.githubusercontent.com/Financial-Times/n-makefile/$(LATEST)/Makefile > n.Makefile
	@echo " OK I updated n.Makefile to $(LATEST)"
