# Patches

This directory contains patches applied to dependencies using patch-package.

## tough-cookie@4.1.4, tr46@5.1.0, uri-js@4.4.1

These patches fix the Node.js deprecation warning for the built-in `punycode` module by replacing:
- `require("punycode/")` with `require("punycode")`
- `import punycode from "punycode"` with `import punycode from "punycode"`

This resolves the warning: "The `punycode` module is deprecated. Please use a userland alternative instead."
