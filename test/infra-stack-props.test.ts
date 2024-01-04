/* Copyright OpenSearch Contributors
SPDX-License-Identifier: Apache-2.0

The OpenSearch Contributors require contributions made to
this file be licensed under the Apache-2.0 license or a
compatible open source license. */

import { App } from 'aws-cdk-lib';
import { InfraStack } from '../lib/infra/infra-stack';
import { NetworkStack } from '../lib/networking/vpc-stack';

test('Throw error on incorrect JSON for opensearch', () => {
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
      additionalConfig: '{ "name": "John Doe", "age": 30, email": "johndoe@example.com" }',
      additionalOsdConfig: '{ "something.enabled": "true", "something_else.enabled": "false" }',
    },
  });
    // WHEN
  try {
    // WHEN
    const networkStack = new NetworkStack(app, 'opensearch-network-stack', {
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // @ts-ignore
    const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
      vpc: networkStack.vpc,
      securityGroup: networkStack.osSecurityGroup,
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // eslint-disable-next-line no-undef
    fail('Expected an error to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    // @ts-ignore
    expect(error.message).toEqual('Encountered following error while parsing additionalConfig json parameter: '
      + 'SyntaxError: Unexpected token e in JSON at position 33');
  }
});

test('Throw error on incorrect JSON for opensearch-dashboards', () => {
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
      additionalOsdConfig: '{ "something.enabled": "true", something_else.enabled": "false" }',
    },
  });
    // WHEN
  try {
    // WHEN
    const networkStack = new NetworkStack(app, 'opensearch-network-stack', {
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // @ts-ignore
    const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
      vpc: networkStack.vpc,
      securityGroup: networkStack.osSecurityGroup,
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // eslint-disable-next-line no-undef
    fail('Expected an error to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    // @ts-ignore
    expect(error.message).toEqual('Encountered following error while parsing additionalOsdConfig json parameter: '
      + 'SyntaxError: Unexpected token s in JSON at position 31');
  }
});

test('Throw error on missing distVersion', () => {
  const app = new App({
    context: {
      securityDisabled: true,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      additionalConfig: '{ "name": "John Doe", "age": 30, "email": "johndoe@example.com" }',
      additionalOsdConfig: '{ "something.enabled": "true", something_else.enabled": "false" }',
    },
  });
    // WHEN
  try {
    // WHEN
    const networkStack = new NetworkStack(app, 'opensearch-network-stack', {
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // @ts-ignore
    const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
      vpc: networkStack.vpc,
      securityGroup: networkStack.osSecurityGroup,
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // eslint-disable-next-line no-undef
    fail('Expected an error to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    // @ts-ignore
    expect(error.message).toEqual('distVersion parameter cannot be empty! Please provide the OpenSearch distribution version');
  }
});

test('Throw error on missing security parameter', () => {
  const app = new App({
    context: {
      distVersion: '1.0.0',
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      additionalConfig: '{ "name": "John Doe", "age": 30, "email": "johndoe@example.com" }',
      additionalOsdConfig: '{ "something.enabled": "true", something_else.enabled": "false" }',
    },
  });
    // WHEN
  try {
    // WHEN
    const networkStack = new NetworkStack(app, 'opensearch-network-stack', {
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // @ts-ignore
    const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
      vpc: networkStack.vpc,
      securityGroup: networkStack.osSecurityGroup,
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // eslint-disable-next-line no-undef
    fail('Expected an error to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    // @ts-ignore
    expect(error.message).toEqual('securityDisabled parameter is required to be set as - true or false');
  }
});

test('Throw error on missing some parameter', () => {
  const app = new App({
    context: {
      distVersion: '1.0.0',
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      additionalConfig: '{ "name": "John Doe", "age": 30, "email": "johndoe@example.com" }',
      additionalOsdConfig: '{ "something.enabled": "true", "something_else.enabled": "false" }',
    },
  });
    // WHEN
  try {
    // WHEN
    const networkStack = new NetworkStack(app, 'opensearch-network-stack', {
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // @ts-ignore
    const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
      vpc: networkStack.vpc,
      securityGroup: networkStack.osSecurityGroup,
      securityDisabled: false,
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // eslint-disable-next-line no-undef
    fail('Expected an error to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    // @ts-ignore
    expect(error.message).toEqual('minDistribution parameter is required to be set as - true or false');
  }
});

test('Throw error on invalid CPU Arch', () => {
  const app = new App({
    context: {
      distVersion: '1.0.0',
      securityDisabled: false,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'someRandomArch',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      additionalConfig: '{ "name": "John Doe", "age": 30, "email": "johndoe@example.com" }',
      additionalOsdConfig: '{ "something.enabled": "true", something_else.enabled": "false" }',
    },
  });
  // WHEN
  try {
    // WHEN
    const networkStack = new NetworkStack(app, 'opensearch-network-stack', {
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // @ts-ignore
    const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
      vpc: networkStack.vpc,
      securityGroup: networkStack.osSecurityGroup,
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // eslint-disable-next-line no-undef
    fail('Expected an error to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    // @ts-ignore
    expect(error.message).toEqual('Please provide a valid cpu architecture. The valid value can be either x64 or arm64');
  }
});

test('Throw error on missing CPU Arch', () => {
  const app = new App({
    context: {
      distVersion: '1.0.0',
      securityDisabled: false,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      additionalConfig: '{ "name": "John Doe", "age": 30, "email": "johndoe@example.com" }',
      additionalOsdConfig: '{ "something.enabled": "true", something_else.enabled": "false" }',
    },
  });
    // WHEN
  try {
    // WHEN
    const networkStack = new NetworkStack(app, 'opensearch-network-stack', {
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // @ts-ignore
    const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
      vpc: networkStack.vpc,
      securityGroup: networkStack.osSecurityGroup,
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // eslint-disable-next-line no-undef
    fail('Expected an error to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    // @ts-ignore
    expect(error.message).toEqual('cpuArch parameter is required. Valid inputs: x64 or arm64');
  }
});

test('Throw error on invalid CPU Arch', () => {
  const app = new App({
    context: {
      distVersion: '1.0.0',
      securityDisabled: false,
      minDistribution: false,
      cpuArch: 'arm64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      additionalConfig: '{ "name": "John Doe", "age": 30, "email": "johndoe@example.com" }',
      additionalOsdConfig: '{ "something.enabled": "true", something_else.enabled": "false" }',
    },
  });
    // WHEN
  try {
    // WHEN
    const networkStack = new NetworkStack(app, 'opensearch-network-stack', {
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // @ts-ignore
    const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
      vpc: networkStack.vpc,
      securityGroup: networkStack.osSecurityGroup,
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // eslint-disable-next-line no-undef
    fail('Expected an error to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
    // @ts-ignore
    expect(error.message).toEqual('distributionUrl parameter is required. Please provide the OpenSearch distribution artifact url to download');
  }
});
