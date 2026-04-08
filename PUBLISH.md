# Publishing Guide

## Pre-Publish Checklist

1. Update `author`, `repository`, `bugs`, and `homepage` in `package.json` with your real values
2. Update `LICENSE` with your name
3. Make sure `npm test` passes

## Check Package Name Availability

```bash
npm search oathix
```

If the name is taken, use a scoped name:
```json
"name": "@palpatel08/oathix"
```

## Preview What Gets Published

```bash
npm pack --dry-run
```

This shows exactly which files will be included. Verify it only contains:
- `src/` (your source code)
- `README.md`
- `LICENSE`
- `package.json`

To create a local tarball and inspect it:
```bash
npm pack
tar -tzf oathix-1.0.0.tgz
```

## Publish

### Login to npm

```bash
npm login
```

### Publish (public package)

```bash
npm publish
```

### Publish scoped package

```bash
npm publish --access public
```

## Versioning

Follow semantic versioning:

```bash
# Bug fixes (1.0.0 → 1.0.1)
npm version patch

# New features, backward compatible (1.0.0 → 1.1.0)
npm version minor

# Breaking changes (1.0.0 → 2.0.0)
npm version major
```

Each command updates `package.json` and creates a git tag. Then publish:

```bash
npm publish
```

## Best Practices

- Never publish secrets (`.env`, API keys). The `.npmignore` and `files` field handle this.
- Keep the package lightweight. Only `src/`, `README.md`, and `LICENSE` are published.
- Test locally before publishing: `npm pack` then `npm install ./oathix-1.0.0.tgz` in another project.
- Use `npm version` commands instead of manually editing the version.
- Tag releases in git after publishing.
