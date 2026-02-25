- [Overview](#overview)
- [Releasing](#releasing)

## Overview

This document explains the release strategy for artifacts in this organization.

## Releasing

The release process is standard across repositories in this org and is run by a release manager volunteering from amongst [maintainers](MAINTAINERS.md).

1. Create a tag, e.g. v2.1.0, and push it to the GitHub repo.
2. The [release-drafter.yml](.github/workflows/release-drafter.yml) will be automatically kicked off.
1. Before creating a release, this workflow creates a GitHub issue asking for approval from the [maintainers](MAINTAINERS.md). See sample [issue](https://github.com/gaiksaya/opensearch-js/issues/1). The maintainers need to approve in order to continue the workflow run.
1. Since the repo is already added as part of NPM trusted publisher, `npm publish` with npm version v11.5.1 or above will directly authenticate the workflow and publish to NPM.
1. Once the above release workflow is successful, the release on GitHub is published automatically.
6. Increment "version" in package.json to the next patch release, e.g. v2.1.1.
