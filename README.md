# eza-js

easy archiver for Windows.

move speficied files and/or directories to `archive` sub-directory of current path.

## Getting started

in eza-js directory.

```batchfile
> npm install
```

optional
```batchfile
> npm link
```

## Usage

```batchfile
> eza some-old-but-undeletable-file
```

then, files will be moved to `archive` sub-directory.

new location is `.\archive\2019-12-02\some-old-but-undeletable-file`

date sub-directory is automatically made. 

## Environment variables

- `EZA_ARCHIVE_DIR_NAME`: customize `archive` sub-directory name (default: archive)
- `EZA_ARCHIVE_DIR_SUFFIX`: customize date sub-directory template (default: YYYY-MM-DD)
- `EZA_FOLDER_ICON`: customize icon of `archive` sub-directory (default: none)
