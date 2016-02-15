# Contribution Guide

Two main types of tasks.  Common and sub.

Common tasks are the public facing API of the Makefile.  Developers/CI should run these commands.
Sub-tasks are the inner, private workings of n-makefile.  Developers/CI ought not to run these commands.

Type specific conventions

- For ‘common’ tasks
    - if we permit the task to be overwritten it may end with % instead of its final letter, allowing it to be overwritten without producing warnings. (this is a hack, of course, and means we have to be careful about how we name our common tasks!)
    - by convention, app/component Makefiles make call commontaskname-super from inside their override to run the parent common task functionality.
- For sub-tasks
    - name must match the directory name they generate, if they generate a directory
    - otherwise, snake_case_is_used with a `_` prefix
    - the name should match the pattern _commontaskname_subtaskname.  E.g. _install_scss_lint

All task conventions

Try to end each command with a friendly `@$(DONE)`

For npm dev dependencies, assume they're there (hope that the devDependencies bring them), optionally warn the developer to install them.  Don't try to install them from here.

Scss-lint is a special case because Ruby.  That is allowed to be installed here but let's try to avoid doing that unless we absolutely have to.
