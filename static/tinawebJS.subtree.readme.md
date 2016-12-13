### About the tinawebjs directory

This directory contains the copy of
https://github.com/moma/tinawebJS/tree/comex_wip

It was added via:
```
git remote add twjs_custom https://github.com/moma/tinawebJS.git
git subtree add --squash --prefix=static/tinawebJS twjs_custom comex_wip
```

It replaces an identical copy that wasn't inside `static` dir, which itself replaced an old submodule in https://github.com/moma/legacy_php_comex ...
