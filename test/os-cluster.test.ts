/* Copyright OpenSearch Contributors
SPDX-License-Identifier: Apache-2.0

The OpenSearch Contributors require contributions made to
this file be licensed under the Apache-2.0 license or a
compatible open source license. */

import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { OsClusterEntrypoint } from '../lib/os-cluster-entrypoint';

test('Test Resources with security disabled multi-node default instance types', () => {
  const app = new App({

    context: {
      securityDisabled: true,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      distVersion: '1.0.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      additionalConfig: '{ "name": "John Doe", "age": 30, "email": "johndoe@example.com" }',
    },
  });

  // WHEN
  const securityDisabledStack = new OsClusterEntrypoint(app, {
    env: { account: 'test-account', region: 'us-east-1' },
  });
  expect(securityDisabledStack.stacks).toHaveLength(2);
  const networkStack = securityDisabledStack.stacks.filter((s) => s.stackName === 'opensearch-network-stack')[0];
  const networkTemplate = Template.fromStack(networkStack);
  networkTemplate.resourceCountIs('AWS::EC2::VPC', 1);
  networkTemplate.resourceCountIs('AWS::EC2::SecurityGroup', 1);

  const infraStack = securityDisabledStack.stacks.filter((s) => s.stackName === 'opensearch-infra-stack')[0];
  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.resourceCountIs('AWS::Logs::LogGroup', 1);
  infraTemplate.resourceCountIs('AWS::IAM::Role', 1);
  infraTemplate.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 3);
  infraTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
  infraTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 2);
  infraTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);
  infraTemplate.resourceCountIs('AWS::AutoScaling::LaunchConfiguration', 3);
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 80,
    Protocol: 'TCP',
  });
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 8443,
    Protocol: 'TCP',
  });
  infraTemplate.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
    InstanceType: 'r5.large',
    IamInstanceProfile: {
      Ref: 'dataNodeAsgInstanceProfileEC27E8D1',
    },
  });
  infraTemplate.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
    InstanceType: 'c5.xlarge',
    IamInstanceProfile: {
      Ref: 'seedNodeAsgInstanceProfile6F1EA4FF',
    },
  });
  infraTemplate.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
    InstanceType: 'c5.xlarge',
    IamInstanceProfile: {
      Ref: 'managerNodeAsgInstanceProfile1415C2CF',
    },
  });
});

test('Test Resources with security enabled multi-node with existing Vpc with user provided data and ml instance types', () => {
  const app = new App({
    context: {
      securityDisabled: false,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      distVersion: '1.0.0',
      vpcId: 'vpc-12345',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: '10.10.10.10/32',
      dataNodeStorage: 200,
      mlNodeCount: 1,
      mlInstanceType: 'g5.xlarge',
      dataInstanceType: 'r5.xlarge',
    },
  });

  // WHEN
  const securityEnabledStack = new OsClusterEntrypoint(app, {
    env: { account: 'test-account', region: 'us-east-1' },
  });
  expect(securityEnabledStack.stacks).toHaveLength(2);
  const networkStack = securityEnabledStack.stacks.filter((s) => s.stackName === 'opensearch-network-stack')[0];
  const networkTemplate = Template.fromStack(networkStack);
  networkTemplate.resourceCountIs('AWS::EC2::VPC', 0);
  networkTemplate.resourceCountIs('AWS::EC2::SecurityGroup', 1);
  networkTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
    VpcId: 'vpc-12345',
  });
  networkTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
    SecurityGroupIngress: [
      {
        CidrIp: '10.10.10.10/32',
      },
    ],
  });

  const infraStack = securityEnabledStack.stacks.filter((s) => s.stackName === 'opensearch-infra-stack')[0];
  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.resourceCountIs('AWS::AutoScaling::LaunchConfiguration', 4);
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 443,
    Protocol: 'TCP',
  });
  infraTemplate.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
    BlockDeviceMappings: [
      {
        Ebs: {
          VolumeSize: 200,
        },
      },
    ],
  });
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Scheme: 'internet-facing',
  });
  infraTemplate.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
    InstanceType: 'r5.xlarge',
    IamInstanceProfile: {
      Ref: 'dataNodeAsgInstanceProfileEC27E8D1',
    },
  });
  infraTemplate.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
    InstanceType: 'g5.xlarge',
    IamInstanceProfile: {
      Ref: 'mlNodeAsgInstanceProfileFF393D8C',
    },
  });
});

test('Test Resources with security enabled single-node cluster', () => {
  const app = new App({
    context: {
      securityDisabled: false,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: true,
      dashboardsUrl: 'www.example.com',
      distVersion: '1.0.0',
      serverAccessType: 'prefixList',
      restrictServerAccessTo: 'pl-12345',
      dataNodeStorage: 200,
      isInternal: true,
    },
  });

  // WHEN
  const singleNodeStack = new OsClusterEntrypoint(app, {
    env: { account: 'test-account', region: 'us-east-1' },
  });
  expect(singleNodeStack.stacks).toHaveLength(2);
  const networkStack = singleNodeStack.stacks.filter((s) => s.stackName === 'opensearch-network-stack')[0];
  const networkTemplate = Template.fromStack(networkStack);
  networkTemplate.resourceCountIs('AWS::EC2::VPC', 1);
  networkTemplate.resourceCountIs('AWS::EC2::SecurityGroup', 1);

  const infraStack = singleNodeStack.stacks.filter((s) => s.stackName === 'opensearch-infra-stack')[0];
  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 443,
    Protocol: 'TCP',
  });
  infraTemplate.resourceCountIs('AWS::EC2::Instance', 1);
  infraTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
  infraTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 2);
  infraTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);
  infraTemplate.hasResourceProperties('AWS::EC2::Instance', {
    BlockDeviceMappings: [
      {
        Ebs: {
          VolumeSize: 200,
        },
      },
    ],
  });
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Scheme: 'internal',
  });
});

test('Throw error on wrong cpu arch to instance mapping', () => {
  const app = new App({
    context: {
      securityDisabled: false,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'arm64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      distVersion: '1.0.0',
      serverAccessType: 'prefixList',
      restrictServerAccessTo: 'pl-12345',
      dataNodeStorage: 200,
      isInternal: true,
      mlNodeCount: 1,
      mlInstanceType: 'g5.xlarge',
      dataInstanceType: 'r5.xlarge',
    },
  });
  // WHEN
  try {
    const testStack = new OsClusterEntrypoint(app, {
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // eslint-disable-next-line no-undef
    fail('Expected an error to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    // eslint-disable-next-line max-len
    expect(error.message).toEqual('Invalid instance type provided, please provide any one the following: m6g.xlarge,m6g.2xlarge,c6g.large,c6g.xlarge,r6g.large,r6g.xlarge,g5g.large,g5g.xlarge');
  }
});

test('Throw error on ec2 instance outside of enum list', () => {
  const app = new App({
    context: {
      securityDisabled: false,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      distVersion: '1.0.0',
      serverAccessType: 'prefixList',
      restrictServerAccessTo: 'pl-12345',
      dataNodeStorage: 200,
      isInternal: true,
      dataInstanceType: 'r5.4xlarge',
    },
  });
  // WHEN
  try {
    const testStack = new OsClusterEntrypoint(app, {
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // eslint-disable-next-line no-undef
    fail('Expected an error to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    // eslint-disable-next-line max-len
    expect(error.message).toEqual('Invalid instance type provided, please provide any one the following: m5.xlarge,m5.2xlarge,c5.large,c5.xlarge,r5.large,r5.xlarge,g5.large,g5.xlarge,inf1.xlarge,inf1.2xlarge');
  }
});

test('Test multi-node cluster with only data-nodes', () => {
  const app = new App({
    context: {
      securityDisabled: true,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      distVersion: '1.0.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      managerNodeCount: 0,
      dataNodeCount: 3,
      dataNodeStorage: 200,
    },
  });

  // WHEN
  const testStack = new OsClusterEntrypoint(app, {
    env: { account: 'test-account', region: 'us-east-1' },
  });
  expect(testStack.stacks).toHaveLength(2);

  const infraStack = testStack.stacks.filter((s) => s.stackName === 'opensearch-infra-stack')[0];
  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 2);
  infraTemplate.resourceCountIs('AWS::AutoScaling::LaunchConfiguration', 2);
  infraTemplate.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
    InstanceType: 'r5.large',
    IamInstanceProfile: {
      Ref: 'seedNodeAsgInstanceProfile6F1EA4FF',
    },
    BlockDeviceMappings: [
      {
        Ebs: {
          VolumeSize: 200,
        },
      },
    ],
  });
});
