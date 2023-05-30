/* Copyright OpenSearch Contributors
SPDX-License-Identifier: Apache-2.0

The OpenSearch Contributors require contributions made to
this file be licensed under the Apache-2.0 license or a
compatible open source license. */

import { InstanceClass, InstanceSize, InstanceType } from 'aws-cdk-lib/aws-ec2';

export const nodeConfig = new Map<string, object>();

nodeConfig.set('manager', {
  'node.roles': ['cluster_manager'],
});

nodeConfig.set('data', {
  'node.roles': ['data', 'ingest'],
});

nodeConfig.set('seed-manager', {
  'node.name': 'seed',
  'node.roles': ['cluster_manager'],
});

nodeConfig.set('seed-data', {
  'node.name': 'seed',
  'node.roles': ['cluster_manager', 'data'],
});

nodeConfig.set('client', {
  'node.name': 'client-node',
  'node.roles': [],
});

nodeConfig.set('ml', {
  'node.name': 'ml-node',
  'node.roles': ['ml'],
});

export enum x64Ec2InstanceType {
  M5_XLARGE = 'm5.xlarge',
  M5_2XLARGE = 'm5.2xlarge',
  C5_LARGE = 'c5.large',
  C5_XLARGE = 'c5.xlarge',
  R5_LARGE = 'r5.large',
  R5_XLARGE = 'r5.xlarge',
  R5_2XLARGE = 'r5.2xlarge',
  G5_LARGE = 'g5.large',
  G5_XLARGE = 'g5.xlarge',
  INF1_XLARGE = 'inf1.xlarge',
  INF1_2XLARGE = 'inf1.2xlarge'
}

export enum arm64Ec2InstanceType {
  M6G_XLARGE = 'm6g.xlarge',
  M6G_2XLARGE = 'm6g.2xlarge',
  C6G_LARGE = 'c6g.large',
  C6G_XLARGE = 'c6g.xlarge',
  R6G_LARGE = 'r6g.large',
  R6G_XLARGE = 'r6g.xlarge',
  R6G_2XLARGE = 'r6g.2xlarge',
  G5G_LARGE = 'g5g.large',
  G5G_XLARGE = 'g5g.xlarge'
}

export const getX64InstanceTypes = (instanceType: string) => {
  switch (instanceType) {
  case x64Ec2InstanceType.M5_XLARGE:
    return InstanceType.of(InstanceClass.M5, InstanceSize.XLARGE);
  case x64Ec2InstanceType.M5_2XLARGE:
    return InstanceType.of(InstanceClass.M5, InstanceSize.XLARGE2);
  case x64Ec2InstanceType.C5_LARGE:
    return InstanceType.of(InstanceClass.C5, InstanceSize.LARGE);
  case x64Ec2InstanceType.C5_XLARGE:
    return InstanceType.of(InstanceClass.C5, InstanceSize.XLARGE);
  case x64Ec2InstanceType.R5_LARGE:
    return InstanceType.of(InstanceClass.R5, InstanceSize.LARGE);
  case x64Ec2InstanceType.R5_XLARGE:
    return InstanceType.of(InstanceClass.R5, InstanceSize.XLARGE);
  case x64Ec2InstanceType.R5_2XLARGE:
    return InstanceType.of(InstanceClass.R5, InstanceSize.XLARGE2);
  case x64Ec2InstanceType.G5_LARGE:
    return InstanceType.of(InstanceClass.G5, InstanceSize.LARGE);
  case x64Ec2InstanceType.G5_XLARGE:
    return InstanceType.of(InstanceClass.G5, InstanceSize.XLARGE);
  case x64Ec2InstanceType.INF1_XLARGE:
    return InstanceType.of(InstanceClass.INF1, InstanceSize.XLARGE);
  case x64Ec2InstanceType.INF1_2XLARGE:
    return InstanceType.of(InstanceClass.INF1, InstanceSize.XLARGE2);
  default:
    throw new Error(`Invalid instance type provided, please provide any one the following: ${Object.values(x64Ec2InstanceType)}`);
  }
};

export const getArm64InstanceTypes = (instanceType: string) => {
  switch (instanceType) {
  case arm64Ec2InstanceType.M6G_XLARGE:
    return InstanceType.of(InstanceClass.M6G, InstanceSize.XLARGE);
  case arm64Ec2InstanceType.M6G_2XLARGE:
    return InstanceType.of(InstanceClass.M6G, InstanceSize.XLARGE2);
  case arm64Ec2InstanceType.C6G_LARGE:
    return InstanceType.of(InstanceClass.C6G, InstanceSize.LARGE);
  case arm64Ec2InstanceType.C6G_XLARGE:
    return InstanceType.of(InstanceClass.C6G, InstanceSize.XLARGE);
  case arm64Ec2InstanceType.R6G_LARGE:
    return InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE);
  case arm64Ec2InstanceType.R6G_XLARGE:
    return InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE);
  case arm64Ec2InstanceType.R6G_2XLARGE:
    return InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE2);
  case arm64Ec2InstanceType.G5G_LARGE:
    return InstanceType.of(InstanceClass.G5G, InstanceSize.LARGE);
  case arm64Ec2InstanceType.G5G_XLARGE:
    return InstanceType.of(InstanceClass.G5G, InstanceSize.XLARGE);
  default:
    throw new Error(`Invalid instance type provided, please provide any one the following: ${Object.values(arm64Ec2InstanceType)}`);
  }
};
