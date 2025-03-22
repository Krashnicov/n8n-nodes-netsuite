# Dependency Patching

This document describes how we handle patching dependencies for specific issues.

## Punycode Deprecation Fix

Node.js has deprecated its built-in `punycode` module with the warning:
> The `punycode` module is deprecated. Please use a userland alternative instead.

To resolve this issue, we've patched the following dependencies to use the userland `punycode` package instead of the built-in module:

- tough-cookie@4.1.4
- tr46@5.1.0
- uri-js@4.4.1

These patches are applied automatically via the `patch-package` tool during installation.

### Updating the Patches

If you need to update these patches or create new ones:

1. Make the necessary changes to the files in `node_modules`
2. Run `npx patch-package <package-name>` to generate the patch
3. Commit the new/updated patch files

### Removing Patches

When a dependency is updated and no longer requires patching:

1. Remove the corresponding patch file from the `patches` directory
2. Update this documentation
