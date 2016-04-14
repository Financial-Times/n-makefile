LATEST=$(curl -s https://api.github.com/repos/Financial-Times/n-makefile/tags | grep name | head -n 1 | sed 's/[," ]//g' | cut -d ':' -f 2)
curl -sL https://raw.githubusercontent.com/Financial-Times/n-makefile/$LATEST/Makefile > n.Makefile
sed -i "" "s/^VERSION = master/VERSION = $LATEST/" n.Makefile
make -F n.Makefile setup-dotfiles
