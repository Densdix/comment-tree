# Change Log

All notable changes to the "comment-tree" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.6] - 2026-06-09

### Added
- **`.gitignore` support**: Files and folders listed in `.gitignore` are now automatically excluded from comment scanning. Controlled by the new `commentExplorer.useGitignore` setting (enabled by default).
- **Python exclusions**: Added default exclusions for `venv`, `.venv`, `env`, `.env`, `__pycache__`, `.pytest_cache`, `.mypy_cache`, `.ipynb_checkpoints`.
- **Gradle / Flutter exclusions**: Added default exclusions for `.gradle` and `.dart_tool` directories.

## [0.0.5] - 2026-06-09

### Fixed
- C and C++ preprocessor directives (`#include`, `#define`, `#pragma`, etc.) are no longer treated as comments.

## [0.0.1] - Initial release

- Initial release.
