#!/usr/bin/env node
/* Copyright OpenSearch Contributors
SPDX-License-Identifier: Apache-2.0

The OpenSearch Contributors require contributions made to
this file be licensed under the Apache-2.0 license or a
compatible open source license. */

import { App } from 'aws-cdk-lib';
import 'source-map-support/register';
import { InfraStack } from '../lib/infra/infra-stack';
import { NetworkStack } from '../lib/networking/vpc-stack';

const app = new App();
const region = app.node.tryGetContext('region') ?? process.env.CDK_DEFAULT_REGION;
const account = app.node.tryGetContext('account') ?? process.env.CDK_DEFAULT_ACCOUNT;

const suffix = `${app.node.tryGetContext('suffix')}`;
const networkStackSuffix = `${app.node.tryGetContext('networkStackSuffix')}`;

let networkStackName = 'opensearch-network-stack';
if (networkStackSuffix !== 'undefined') {
  networkStackName = `opensearch-network-stack-${networkStackSuffix}`;
}
let infraStackName = 'opensearch-infra-stack';
if (suffix !== 'undefined') {
  infraStackName = `opensearch-infra-stack-${suffix}`;
}

const networkStack = new NetworkStack(app, networkStackName, {
  env: { account, region },
});

// @ts-ignore
const infraStack = new InfraStack(app, infraStackName, {
  vpc: networkStack.vpc,
  securityGroup: networkStack.osSecurityGroup,
  env: { account, region },
});

infraStack.addDependency(networkStack);
