# How to Update oathix

## Step 1: Make Your Code Changes

Edit the files in `src/` as needed.

## Step 2: Bump the Version

Pick the right command based on what changed:

```bash
# Bug fix (1.0.0 → 1.0.1)
npm version patch

# New feature, backward compatible (1.0.0 → 1.1.0)
npm version minor

# Breaking change (1.0.0 → 2.0.0)
npm version major
```

This automatically updates the version in `package.json` and creates a git commit + tag.

## Step 3: Publish the Update

```bash
npm publish
```

Enter your 2FA code when prompted.

## Step 4: Verify

```bash
npm info oathix version
```

Or check at https://www.npmjs.com/package/oathix

## Quick Reference

| Change Type       | Command             | Example          |
|-------------------|---------------------|------------------|
| Bug fix           | `npm version patch` | 1.0.0 → 1.0.1   |
| New feature       | `npm version minor` | 1.0.0 → 1.1.0   |
| Breaking change   | `npm version major` | 1.0.0 → 2.0.0   |

## Example: Adding GitHub Provider

1. Create `src/providers/github.js`
2. Register it in `src/core/client.js`
3. Update README with new usage examples
4. Bump version and publish:

```bash
npm version minor
npm publish
```

Use `minor` here because adding a new provider is a new feature that doesn't break existing usage.
