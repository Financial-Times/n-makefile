# Warning, don't edit this file, it's maintained on GitHub and updated by runing `make update-tools`
# Submit PR's here: https://www.github.com/Financial-Times/n-makefile

update-tools:
	#$(eval LATEST := )
	curl -s https://api.github.com/Financial-Times/n-makefile/tags | grep name | head -n 1 | sed 's/[," ]//g' | cut -d ':' -f 2
	echo $(LATEST)

