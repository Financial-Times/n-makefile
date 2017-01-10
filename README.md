# n-makefile

## Installing

Download the latest release of `n-makefile` into the root directory of your project:-
```sh
LATEST=$(curl -s https://api.github.com/repos/Financial-Times/n-makefile/tags | grep name | head -n 1 | sed 's/[," ]//g' | cut -d ':' -f 2)
curl -sL "https://raw.githubusercontent.com/Financial-Times/n-makefile/${LATEST}/Makefile" > n.Makefile
perl -p -i -e "s/^VERSION = master/VERSION = ${LATEST}/" n.Makefile
```

Add this to the top of your `Makefile`:-
```Makefile
include n.Makefile
```

If your app has a `Procfile` then you will need to add `haikro` as a dev dependency to your project:-

```sh
npm install -D haikro
```

Now commit and go:-
```sh
git add Makefile n.Makefile
git commit -m "Add build tools at version $LATEST"
git push
```


## Introduction

### Problems trying to solve over NBT (and OBT)

- Enormous dependency tree.  The `npm install` part of builds are often the slowest thing.  It's crazy that when you're building apps that don't and can never have front ends (APIs, Lambda functions) you still need to pull in webpack, Sass, etc just to get the toolchain.
- Everyone's code editors would be much happier if the dotfiles were in the place those expect them to be.  `n-makefile` puts (or expects) `.editorconfig`, `.scss-lint.yml`, etc in the root directory of projects.
- `make install` was dependent on `make install` having run before.  (`obt install` required `obt` to be there).
- Try to eliminate the need to add the custom `:node_modules/.bin` to everyone's `$PATH`.

### What this is not

- A complete rewrite in bash/Makefile.  The ‘heavy lifting’ should still be done by npm modules.  There'll probably be a bit **too** much implemented in bash/Makefile initially whilst we figure out exactly where to draw the line in what logic should be controlled by bash/Makefile and what should be handled by the npm modules.

### Philosophy

- Always **default to doing nothing**.
- Each feature should work in **isolation**.
- Rely on **signals** and **intelligently infer** what to do.
- The developer can **always override** anything.
- Unused features must not slow things down.

## Commands

### `clean`

Removes all the uncommited files and folders from the local clone.

### `install`

`make install` may pull in two types of thing.  Packages and dot files.

#### Packages

- Only try to install npm modules if there's a `package.json` file.
- Only try to install bower components if there's a `bower.json` file.
- Only try to install the `scss-lint` Ruby Gem if it's not already installed and if there are actually `*.scss` files in the project.

(We hope to get rid of scss-lint as soon as the Node port gains feature parity, and then it'll come through the npm module installation step)

#### Dot files
E.g. `.editorconfig`, `.scss-lint.yml`, or `.eslintrc.js`

- By default, no nothing.
- If a dot file is commited to the repository don't overwrite it — i.e. also do nothing (default behaviour in Makefile).
- If a dot file is not commited but **is listed in the `.gitignore` file**, download it during `make install`.

##### Note: The `.env` dot file contains private keys. Handle with care.
Rather than risk generating .env files in different environments, makefile does not invoke the .env target automatically. If you're in a development environment, and you want to import the project's environment variables, You will need to run 'make .env' youself.

### `assets` and `assets-production`

For repositories that have client side assets to build (i.e. if `webpack.config.js` exists):-

- Runs `webpack` with development settings (if `assets`) or with production settings (if `assets-production`).

### `build` and `build-production`

For repositories that have client side assets to build runs `assets`/`assets-production`

For Heroku apps (i.e. if a `Procfile` exists):-

- Creates `public/__about.json` with some metadata about the current build.
- Runs `haikro build` to prepare a `.tar.gz` file for uploading to Heroku (`build-production` only).

### `verify`

- Only run the verify step **if** the relevant dot file exists.  E.g. only run `eslint` if `.eslintrc.js` exists.
- Run the linting tool against an appropriate subset of the files committed to the project.

### `update-tools`

Updates your project's copy of `n-makefile` to the latest version.

### `help`

Prints usage information for the rules defined in the Makefile.

Add your own descriptions by commenting your rules like so:

```make
rule-%: ## rule-name: Rule description.
```

## Contribution

Please read the [contribution guide](./CONTRIBUTION.md).
