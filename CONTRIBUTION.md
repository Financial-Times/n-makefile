# Contribution Guide

## Rules

`make` has ‘rules’.  These are groups of commands that can be executed by entering `make RULE-NAME` your terminal.  In all Next projects we have rules such as `install`, `run`, `deploy`, etc.

In `n-makefile` we have two main types of rules.  Common and sub.

- Common rules are the public facing API of the Makefile.  Developers/CI should run these commands.
- Sub-rules are the inner, private workings of n-makefile.  Developers/CI ought not to run these commands.

### ‘Common’ rule conventions

- If we permit the rule to be overwritten it may end with % instead of its final letter, allowing it to be overwritten without producing warnings. (this is a hack, of course, and means we have to be careful about how we name our common rules!)
- By convention, app/component Makefiles make call commonrulename-super from inside their override to run the parent common rule functionality.
- Include a comment using the following convention for it to be automatically parsed by the `help` rule:

```make
rule-nam%: ## rule-name: Rule description.
```

### ‘Sub’ rule conventions

- Name must match the directory name they generate, if they generate a directory
- Otherwise, `_snake_case_is_used` with a `_` prefix
- The name should match the pattern _commonrulename_subrulename.  E.g. _install_scss_lint

### All rule conventions

- Try to end each rule with a friendly `@$(DONE)`
- For npm dev dependencies, assume they're there (hope that the devDependencies bring them), optionally warn the developer to install them.  Don't try to install them from `n-makefile`.
- Scss-lint is a special case because of Ruby.  That is allowed to be installed here but let's try to avoid doing that unless we absolutely have to.
