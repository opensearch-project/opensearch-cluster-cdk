/* Copyright OpenSearch Contributors
SPDX-License-Identifier: Apache-2.0

The OpenSearch Contributors require contributions made to
this file be licensed under the Apache-2.0 license or a
compatible open source license. */

import { InstanceClass, InstanceSize, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { EbsDeviceVolumeType } from 'aws-cdk-lib/aws-autoscaling';

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
  C5_2XLARGE = 'c5.2xlarge',
  C5D_XLARGE = 'c5d.xlarge',
  C5D_2XLARGE = 'c5d.2xlarge',
  R5_LARGE = 'r5.large',
  R5_XLARGE = 'r5.xlarge',
  R5_2XLARGE = 'r5.2xlarge',
  R5_4XLARGE = 'r5.4xlarge',
  R5_8XLARGE = 'r5.8xlarge',
  R5D_XLARGE = 'r5d.xlarge',
  R5D_2XLARGE = 'r5d.2xlarge',
  R5D_4XLARGE = 'r5d.4xlarge',
  R5D_8XLARGE = 'r5d.8xlarge',
  G5_LARGE = 'g5.large',
  G5_XLARGE = 'g5.xlarge',
  I3_LARGE = 'i3.large',
  I3_XLARGE = 'i3.xlarge',
  I3_2XLARGE = 'i3.2xlarge',
  I3_4XLARGE = 'i3.4xlarge',
  I3_8XLARGE = 'i3.8xlarge',
  INF1_XLARGE = 'inf1.xlarge',
  INF1_2XLARGE = 'inf1.2xlarge',
  T3_MEDIUM = 't3.medium'
}

export enum arm64Ec2InstanceType {
  M6G_XLARGE = 'm6g.xlarge',
  M6G_2XLARGE = 'm6g.2xlarge',
  C6A_XLARGE = 'c6a.xlarge',
  C6A_2XLARGE = 'c6a.2xlarge',
  C6A_4XLARGE = 'c6a.4xlarge',
  C6G_LARGE = 'c6g.large',
  C6G_XLARGE = 'c6g.xlarge',
  C6G_2XLARGE = 'c6g.2xlarge',
  C6GD_XLARGE = 'c6gd.xlarge',
  C6GD_2XLARGE = 'c6gd.2xlarge',
  C6GD_4XLARGE = 'c6gd.4xlarge',
  C6GD_8XLARGE = 'c6gd.8xlarge',
  R6G_LARGE = 'r6g.large',
  R6G_XLARGE = 'r6g.xlarge',
  R6G_2XLARGE = 'r6g.2xlarge',
  R6G_4XLARGE = 'r6g.4xlarge',
  R6G_8XLARGE = 'r6g.8xlarge',
  R6GD_XLARGE = 'r6gd.xlarge',
  R6GD_2XLARGE = 'r6gd.2xlarge',
  R6GD_4XLARGE = 'r6gd.4xlarge',
  R6GD_8XLARGE = 'r6gd.8xlarge',
  R7GD_XLARGE = 'r7gd.xlarge',
  R7GD_2XLARGE = 'r7gd.2xlarge',
  R7GD_4XLARGE = 'r7gd.4xlarge',
  R7GD_8XLARGE = 'r7gd.8xlarge',
  G5G_LARGE = 'g5g.large',
  G5G_XLARGE = 'g5g.xlarge'
}
export interface InstanceTypeInfo {
  instance: InstanceType;
  hasInternalStorage: boolean;
}

export const getX64InstanceTypes = (instanceType: string): InstanceTypeInfo => {
  switch (instanceType) {
  case x64Ec2InstanceType.M5_XLARGE:
    return { instance: InstanceType.of(InstanceClass.M5, InstanceSize.XLARGE), hasInternalStorage: false };
  case x64Ec2InstanceType.M5_2XLARGE:
    return { instance: InstanceType.of(InstanceClass.M5, InstanceSize.XLARGE2), hasInternalStorage: false };
  case x64Ec2InstanceType.C5_LARGE:
    return { instance: InstanceType.of(InstanceClass.C5, InstanceSize.LARGE), hasInternalStorage: false };
  case x64Ec2InstanceType.C5_XLARGE:
    return { instance: InstanceType.of(InstanceClass.C5, InstanceSize.XLARGE), hasInternalStorage: false };
  case x64Ec2InstanceType.C5_2XLARGE:
    return { instance: InstanceType.of(InstanceClass.C5, InstanceSize.XLARGE2), hasInternalStorage: false };
  case x64Ec2InstanceType.C5D_XLARGE:
    return { instance: InstanceType.of(InstanceClass.C5D, InstanceSize.XLARGE), hasInternalStorage: true };
  case x64Ec2InstanceType.C5D_2XLARGE:
    return { instance: InstanceType.of(InstanceClass.C5D, InstanceSize.XLARGE2), hasInternalStorage: true };
  case x64Ec2InstanceType.R5_LARGE:
    return { instance: InstanceType.of(InstanceClass.R5, InstanceSize.LARGE), hasInternalStorage: false };
  case x64Ec2InstanceType.R5_XLARGE:
    return { instance: InstanceType.of(InstanceClass.R5, InstanceSize.XLARGE), hasInternalStorage: false };
  case x64Ec2InstanceType.R5_2XLARGE:
    return { instance: InstanceType.of(InstanceClass.R5, InstanceSize.XLARGE2), hasInternalStorage: false };
  case x64Ec2InstanceType.R5_4XLARGE:
    return { instance: InstanceType.of(InstanceClass.R5, InstanceSize.XLARGE4), hasInternalStorage: false };
  case x64Ec2InstanceType.R5_8XLARGE:
    return { instance: InstanceType.of(InstanceClass.R5, InstanceSize.XLARGE8), hasInternalStorage: false };
  case x64Ec2InstanceType.R5D_XLARGE:
    return { instance: InstanceType.of(InstanceClass.R5D, InstanceSize.XLARGE), hasInternalStorage: true };
  case x64Ec2InstanceType.R5D_2XLARGE:
    return { instance: InstanceType.of(InstanceClass.R5D, InstanceSize.XLARGE2), hasInternalStorage: true };
  case x64Ec2InstanceType.R5D_4XLARGE:
    return { instance: InstanceType.of(InstanceClass.R5D, InstanceSize.XLARGE4), hasInternalStorage: true };
  case x64Ec2InstanceType.R5D_8XLARGE:
    return { instance: InstanceType.of(InstanceClass.R5D, InstanceSize.XLARGE8), hasInternalStorage: true };
  case x64Ec2InstanceType.G5_LARGE:
    return { instance: InstanceType.of(InstanceClass.G5, InstanceSize.LARGE), hasInternalStorage: true };
  case x64Ec2InstanceType.G5_XLARGE:
    return { instance: InstanceType.of(InstanceClass.G5, InstanceSize.XLARGE), hasInternalStorage: true };
  case x64Ec2InstanceType.I3_LARGE:
    return { instance: InstanceType.of(InstanceClass.I3, InstanceSize.LARGE), hasInternalStorage: true };
  case x64Ec2InstanceType.I3_XLARGE:
    return { instance: InstanceType.of(InstanceClass.I3, InstanceSize.XLARGE), hasInternalStorage: true };
  case x64Ec2InstanceType.I3_2XLARGE:
    return { instance: InstanceType.of(InstanceClass.I3, InstanceSize.XLARGE2), hasInternalStorage: true };
  case x64Ec2InstanceType.I3_4XLARGE:
    return { instance: InstanceType.of(InstanceClass.I3, InstanceSize.XLARGE4), hasInternalStorage: true };
  case x64Ec2InstanceType.I3_8XLARGE:
    return { instance: InstanceType.of(InstanceClass.I3, InstanceSize.XLARGE8), hasInternalStorage: true };
  case x64Ec2InstanceType.INF1_XLARGE:
    return { instance: InstanceType.of(InstanceClass.INF1, InstanceSize.XLARGE), hasInternalStorage: false };
  case x64Ec2InstanceType.INF1_2XLARGE:
    return { instance: InstanceType.of(InstanceClass.INF1, InstanceSize.XLARGE2), hasInternalStorage: false };
  case x64Ec2InstanceType.T3_MEDIUM:
    return { instance: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM), hasInternalStorage: false };
  default:
    throw new Error(`Invalid instance type provided, please provide any one the following: ${Object.values(x64Ec2InstanceType)}`);
  }
};

export const getArm64InstanceTypes = (instanceType: string): InstanceTypeInfo => {
  switch (instanceType) {
  case arm64Ec2InstanceType.M6G_XLARGE:
    return { instance: InstanceType.of(InstanceClass.M6G, InstanceSize.XLARGE), hasInternalStorage: false };
  case arm64Ec2InstanceType.M6G_2XLARGE:
    return { instance: InstanceType.of(InstanceClass.M6G, InstanceSize.XLARGE2), hasInternalStorage: false };
  case arm64Ec2InstanceType.C6A_XLARGE:
    return { instance: InstanceType.of(InstanceClass.C6A, InstanceSize.XLARGE), hasInternalStorage: false};
  case arm64Ec2InstanceType.C6A_2XLARGE:
    return { instance: InstanceType.of(InstanceClass.C6A, InstanceSize.XLARGE2), hasInternalStorage: false};
  case arm64Ec2InstanceType.C6A_4XLARGE:
    return { instance: InstanceType.of(InstanceClass.C6A, InstanceSize.XLARGE4), hasInternalStorage: false};
  case arm64Ec2InstanceType.C6G_LARGE:
    return { instance: InstanceType.of(InstanceClass.C6G, InstanceSize.LARGE), hasInternalStorage: false };
  case arm64Ec2InstanceType.C6G_XLARGE:
    return { instance: InstanceType.of(InstanceClass.C6G, InstanceSize.XLARGE), hasInternalStorage: false };
  case arm64Ec2InstanceType.C6G_2XLARGE:
    return { instance: InstanceType.of(InstanceClass.C6G, InstanceSize.XLARGE2), hasInternalStorage: false };
  case arm64Ec2InstanceType.C6GD_XLARGE:
    return { instance: InstanceType.of(InstanceClass.C6GD, InstanceSize.XLARGE), hasInternalStorage: true };
  case arm64Ec2InstanceType.C6GD_2XLARGE:
    return { instance: InstanceType.of(InstanceClass.C6GD, InstanceSize.XLARGE2), hasInternalStorage: true };
  case arm64Ec2InstanceType.C6GD_4XLARGE:
    return { instance: InstanceType.of(InstanceClass.C6GD, InstanceSize.XLARGE4), hasInternalStorage: true };
  case arm64Ec2InstanceType.C6GD_8XLARGE:
    return { instance: InstanceType.of(InstanceClass.C6GD, InstanceSize.XLARGE8), hasInternalStorage: true };
  case arm64Ec2InstanceType.R6G_LARGE:
    return { instance: InstanceType.of(InstanceClass.R6G, InstanceSize.LARGE), hasInternalStorage: false };
  case arm64Ec2InstanceType.R6G_XLARGE:
    return { instance: InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE), hasInternalStorage: false };
  case arm64Ec2InstanceType.R6G_2XLARGE:
    return { instance: InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE2), hasInternalStorage: false };
  case arm64Ec2InstanceType.R6G_4XLARGE:
    return { instance: InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE4), hasInternalStorage: false };
  case arm64Ec2InstanceType.R6G_8XLARGE:
    return { instance: InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE8), hasInternalStorage: false };
  case arm64Ec2InstanceType.R6GD_XLARGE:
    return { instance: InstanceType.of(InstanceClass.R6GD, InstanceSize.XLARGE), hasInternalStorage: true };
  case arm64Ec2InstanceType.R6GD_2XLARGE:
    return { instance: InstanceType.of(InstanceClass.R6GD, InstanceSize.XLARGE2), hasInternalStorage: true };
  case arm64Ec2InstanceType.R6GD_4XLARGE:
    return { instance: InstanceType.of(InstanceClass.R6GD, InstanceSize.XLARGE4), hasInternalStorage: true };
  case arm64Ec2InstanceType.R6GD_8XLARGE:
    return { instance: InstanceType.of(InstanceClass.R6GD, InstanceSize.XLARGE8), hasInternalStorage: true };
  case arm64Ec2InstanceType.R7GD_XLARGE:
    return { instance: InstanceType.of(InstanceClass.R7GD, InstanceSize.XLARGE), hasInternalStorage: true };
  case arm64Ec2InstanceType.R7GD_2XLARGE:
    return { instance: InstanceType.of(InstanceClass.R7GD, InstanceSize.XLARGE2), hasInternalStorage: true };
  case arm64Ec2InstanceType.R7GD_4XLARGE:
    return { instance: InstanceType.of(InstanceClass.R7GD, InstanceSize.XLARGE4), hasInternalStorage: true };
  case arm64Ec2InstanceType.R7GD_8XLARGE:
    return { instance: InstanceType.of(InstanceClass.R7GD, InstanceSize.XLARGE8), hasInternalStorage: true };
  case arm64Ec2InstanceType.G5G_LARGE:
    return { instance: InstanceType.of(InstanceClass.G5G, InstanceSize.LARGE), hasInternalStorage: true };
  case arm64Ec2InstanceType.G5G_XLARGE:
    return { instance: InstanceType.of(InstanceClass.G5G, InstanceSize.XLARGE), hasInternalStorage: true };
  default:
    throw new Error(`Invalid instance type provided, please provide any one the following: ${Object.values(arm64Ec2InstanceType)}`);
  }
};

export const getVolumeType = (volumeType: string) => {
  switch (volumeType) {
  case EbsDeviceVolumeType.STANDARD.valueOf():
    return EbsDeviceVolumeType.STANDARD;
  case EbsDeviceVolumeType.GP2.valueOf():
    return EbsDeviceVolumeType.GP2;
  case EbsDeviceVolumeType.GP3.valueOf():
    return EbsDeviceVolumeType.GP3;
  case EbsDeviceVolumeType.IO1.valueOf():
    return EbsDeviceVolumeType.IO1;
  default:
    throw new Error('Invalid volume type provided, please provide any one of the following: standard, gp2, gp3');
  }
};
