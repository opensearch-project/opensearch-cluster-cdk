- [Overview](#overview)
- [Releasing](#releasing)

## Overview

This document explains the release strategy for artifacts in this organization.

## Releasing

The release process is standard across repositories in this org and is run by a release manager volunteering from amongst [maintainers](MAINTAINERS.md).

1. Create a tag, e.g. v2.1.0, and push it to the GitHub repo.
2. The [release-drafter.yml](.github/workflows/release-drafter.yml) will be automatically kicked off.
3. The above release drafter workflow creates an issue asking for confirmation about the release from the mainatiners. Once approved, it creates a draft release in the repository.
4. This draft release triggers the [jenkins release workflow](https://build.ci.opensearch.org/job/opensearch-cluster-cdk-release/) as a result of which opensearch-cluster-cdk is released on [npmjs](https://www.npmjs.com/package/@opensearch-project/opensearch-cluster-cdk).
5. Once the above release workflow is successful, the drafted release on GitHub is published automatically.
6. Increment "version" in package.json to the next patch release, e.g. v2.1.1.