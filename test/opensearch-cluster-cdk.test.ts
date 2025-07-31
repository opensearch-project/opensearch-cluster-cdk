/* Copyright OpenSearch Contributors
SPDX-License-Identifier: Apache-2.0

The OpenSearch Contributors require contributions made to
this file be licensed under the Apache-2.0 license or a
compatible open source license. */

import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { InfraStack } from '../lib/infra/infra-stack';
import { NetworkStack } from '../lib/networking/vpc-stack';

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
      additionalOsdConfig: '{ "something.enabled": "true", "something_else.enabled": "false" }',
      // eslint-disable-next-line max-len
      customConfigFiles: '{"test/data/config.yml": "opensearch/config/opensearch-security/config.yml", "test/data/roles.yml": "opensearch/config/opensearch-security/roles.yml"}',
      enableMonitoring: true,
    },
  });

  // WHEN
  const netStack = new NetworkStack(app, 'opensearch-network-stack', {
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // @ts-ignore
  const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
    vpc: netStack.vpc,
    securityGroup: netStack.osSecurityGroup,
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // THEN
  const networkTemplate = Template.fromStack(netStack);
  networkTemplate.resourceCountIs('AWS::EC2::VPC', 1);
  networkTemplate.resourceCountIs('AWS::EC2::SecurityGroup', 1);

  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.resourceCountIs('AWS::Logs::LogGroup', 1);
  infraTemplate.resourceCountIs('AWS::IAM::Role', 1);
  infraTemplate.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 3);
  infraTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
  infraTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 2);
  infraTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);
  infraTemplate.resourceCountIs('AWS::EC2::LaunchTemplate', 3);
  infraTemplate.resourceCountIs('AWS::CloudWatch::Alarm', 4);
  infraTemplate.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 80,
    Protocol: 'TCP',
  });
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 8443,
    Protocol: 'TCP',
  });
  infraTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
    LaunchTemplateData: {
      InstanceType: 'r5.xlarge',
      MetadataOptions: {
        HttpTokens: 'required',
      },
    },
  });
  infraTemplate.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
    LaunchTemplate: {
      LaunchTemplateId: {
        Ref: 'dataNodeLt6A2F1285',
      },
    },
  });
  infraTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
    LaunchTemplateData: {
      InstanceType: 'c5.xlarge',
      MetadataOptions: {
        HttpTokens: 'required',
      },
    },
  });
  infraTemplate.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
    LaunchTemplate: {
      LaunchTemplateId: {
        Ref: 'seedNodeLt6F5D0A36',
      },
    },
  });
  infraTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
    LaunchTemplateData: {
      InstanceType: 'c5.xlarge',
      MetadataOptions: {
        HttpTokens: 'required',
      },
    },
  });
  infraTemplate.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
    LaunchTemplate: {
      LaunchTemplateId: {
        Ref: 'managerNodeLtDC4E5B3A',
      },
    },
  });
});

test('Test Resources with security disabled multi-node default instance types using class properties', () => {
  const app = new App({});

  // WHEN
  const netStack = new NetworkStack(app, 'opensearch-network-stack', {
    env: { account: 'test-account', region: 'us-east-1' },
    serverAccessType: 'ipv4',
    restrictServerAccessTo: 'all',
  });

  // @ts-ignore
  const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
    vpc: netStack.vpc,
    securityGroup: netStack.osSecurityGroup,
    env: { account: 'test-account', region: 'us-east-1' },
    securityDisabled: true,
    minDistribution: false,
    distributionUrl: 'www.example.com',
    cpuArch: 'x64',
    singleNodeCluster: false,
    dashboardsUrl: 'www.example.com',
    distVersion: '1.0.0',
    additionalConfig: '{ "name": "John Doe", "age": 30, "email": "johndoe@example.com" }',
    additionalOsdConfig: '{ "something.enabled": "true", "something_else.enabled": "false" }',
    // eslint-disable-next-line max-len
    customConfigFiles: '{"test/data/config.yml": "opensearch/config/opensearch-security/config.yml", "test/data/roles.yml": "opensearch/config/opensearch-security/roles.yml"}',
    enableMonitoring: true,
  });

  // THEN
  const networkTemplate = Template.fromStack(netStack);
  networkTemplate.resourceCountIs('AWS::EC2::VPC', 1);
  networkTemplate.resourceCountIs('AWS::EC2::SecurityGroup', 1);

  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.resourceCountIs('AWS::Logs::LogGroup', 1);
  infraTemplate.resourceCountIs('AWS::IAM::Role', 1);
  infraTemplate.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 3);
  infraTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
  infraTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 2);
  infraTemplate.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2);
  infraTemplate.resourceCountIs('AWS::EC2::LaunchTemplate', 3);
  infraTemplate.resourceCountIs('AWS::CloudWatch::Alarm', 4);
  infraTemplate.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 80,
    Protocol: 'TCP',
  });
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 8443,
    Protocol: 'TCP',
  });
  infraTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
    LaunchTemplateData: {
      InstanceType: 'r5.xlarge',
      MetadataOptions: {
        HttpTokens: 'required',
      },
    },
  });
  infraTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
    LaunchTemplateData: {
      InstanceType: 'c5.xlarge',
      MetadataOptions: {
        HttpTokens: 'required',
      },
    },
  });
  infraTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
    LaunchTemplateData: {
      InstanceType: 'c5.xlarge',
      MetadataOptions: {
        HttpTokens: 'required',
      },
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
  const networkStack = new NetworkStack(app, 'opensearch-network-stack', {
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // @ts-ignore
  const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
    vpc: networkStack.vpc,
    securityGroup: networkStack.osSecurityGroup,
    env: { account: 'test-account', region: 'us-east-1' },
  });

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
        Description: 'from 10.10.10.10/32:80',
        FromPort: 80,
        IpProtocol: 'tcp',
        ToPort: 80,
      },
      {
        CidrIp: '10.10.10.10/32',
        Description: 'from 10.10.10.10/32:443',
        FromPort: 443,
        IpProtocol: 'tcp',
        ToPort: 443,
      },
      {
        CidrIp: '10.10.10.10/32',
        Description: 'from 10.10.10.10/32:9200',
        FromPort: 9200,
        IpProtocol: 'tcp',
        ToPort: 9200,
      },
      {
        CidrIp: '10.10.10.10/32',
        Description: 'from 10.10.10.10/32:5601',
        FromPort: 5601,
        IpProtocol: 'tcp',
        ToPort: 5601,
      },
      {
        CidrIp: '10.10.10.10/32',
        Description: 'from 10.10.10.10/32:8443',
        FromPort: 8443,
        IpProtocol: 'tcp',
        ToPort: 8443,
      },
    ],
  });

  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.resourceCountIs('AWS::EC2::LaunchTemplate', 4);
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 443,
    Protocol: 'TCP',
  });
  infraTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
    LaunchTemplateData: {
      BlockDeviceMappings: [
        {
          DeviceName: '/dev/xvda',
          Ebs: {
            VolumeSize: 200,
            VolumeType: 'io1',
            Iops: 5000,
          },
        },
      ],
    },
  });
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Scheme: 'internet-facing',
  });
  infraTemplate.hasResourceProperties('AWS::EC2::LaunchTemplate', {
    LaunchTemplateData: {
      InstanceType: 'g5.xlarge',
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
      dataInstanceType: 'r5.large',
      storageVolumeType: 'gp3',
    },
  });

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
  const networkTemplate = Template.fromStack(networkStack);
  networkTemplate.resourceCountIs('AWS::EC2::VPC', 1);
  networkTemplate.resourceCountIs('AWS::EC2::SecurityGroup', 1);

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
    InstanceType: 'r5.large',
    BlockDeviceMappings: [
      {
        Ebs: {
          VolumeSize: 200,
          VolumeType: 'gp3',
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
    expect(error.message).toEqual('Invalid instance type provided, please provide any one the following: m6g.xlarge,m6g.2xlarge,'
        + 'c6g.large,c6g.xlarge,c6g.2xlarge,c6gd.xlarge,c6gd.2xlarge,c6gd.4xlarge,c6gd.8xlarge,r6g.large,r6g.xlarge,r6g.2xlarge,'
        + 'r6g.4xlarge,r6g.8xlarge,r6gd.xlarge,r6gd.2xlarge,r6gd.4xlarge,r6gd.8xlarge,r7gd.xlarge,r7gd.2xlarge,r7gd.4xlarge,'
        + 'r7gd.8xlarge,g5g.large,g5g.xlarge');
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
      dataInstanceType: 'r5.16xlarge',
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
    expect(error.message).toEqual('Invalid instance type provided, please provide any one the following: m5.xlarge,m5.2xlarge,c5.large,c5.xlarge,'
      + 'c5.2xlarge,c5d.xlarge,c5d.2xlarge,r5.large,r5.xlarge,r5.2xlarge,r5.4xlarge,r5.8xlarge,r5d.xlarge,r5d.2xlarge,r5d.4xlarge,r5d.8xlarge,'
      + 'g5.large,g5.xlarge,i3.large,i3.xlarge,i3.2xlarge,i3.4xlarge,i3.8xlarge,inf1.xlarge,inf1.2xlarge');
  }
});

test("Throw error when useInstanceBasedStorage is true but the chosen instance type doesn't support", () => {
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
      dataInstanceType: 'r5.2xlarge',
      useInstanceBasedStorage: 'true',
    },
  });

  try {
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
    expect(error.message).toEqual('The instance type provided does not have instance backed storage. Please provide correct instance type');
  }
});

test('check if directory is mounted if useInstanceBasedStorage is true', () => {
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
      dataInstanceType: 'c6gd.2xlarge',
      useInstanceBasedStorage: 'true',
    },
  });

  const networkStack = new NetworkStack(app, 'opensearch-network-stack', {
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // @ts-ignore
  const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
    vpc: networkStack.vpc,
    securityGroup: networkStack.osSecurityGroup,
    env: { account: 'test-account', region: 'us-east-1' },
  });

  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.hasResource('AWS::AutoScaling::AutoScalingGroup', {
    /* eslint-disable max-len */
    Metadata: {
      'AWS::CloudFormation::Init': {
        config: {
          commands: {
            '000': {
              command: 'set -ex; sudo mkfs -t xfs /dev/nvme1n1; sudo mkdir /mnt/data; sudo mount /dev/nvme1n1 /mnt/data; sudo chown -R ec2-user:ec2-user /mnt/data',
              ignoreErrors: false,
            },
          },
        },
      },
    },
  });
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
  const networkStack = new NetworkStack(app, 'opensearch-network-stack', {
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // @ts-ignore
  const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
    vpc: networkStack.vpc,
    securityGroup: networkStack.osSecurityGroup,
    env: { account: 'test-account', region: 'us-east-1' },
  });

  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 2);
  infraTemplate.resourceCountIs('AWS::EC2::LaunchTemplate', 2);
});

test('Test multi-node cluster with remote-store enabled', () => {
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
      enableRemoteStore: true,
    },
  });

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
  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.resourceCountIs('AWS::S3::Bucket', 1);
  infraTemplate.resourceCountIs('AWS::S3::BucketPolicy', 1);
  infraTemplate.resourceCountIs('AWS::Lambda::Function', 1);
  infraTemplate.resourceCountIs('AWS::IAM::Role', 2);
  infraTemplate.resourceCountIs('AWS::IAM::Policy', 1);
  infraTemplate.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: 'opensearch-infra-stack',
  });
  infraTemplate.hasResourceProperties('AWS::IAM::Policy', {
    PolicyDocument: {
      Statement: [
        {
          Action: [
            's3:ListBucket',
            's3:GetBucketLocation',
            's3:ListBucketMultipartUploads',
            's3:ListBucketVersions',
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:AbortMultipartUpload',
            's3:ListMultipartUploadParts',
          ],
          Effect: 'Allow',
          Resource: [
            {
              'Fn::GetAtt': [
                'remotestoreopensearchinfrastack6A47755C',
                'Arn',
              ],
            },
            {
              'Fn::Join': [
                '',
                [
                  {
                    'Fn::GetAtt': [
                      'remotestoreopensearchinfrastack6A47755C',
                      'Arn',
                    ],
                  },
                  '/*',
                ],
              ],
            },
          ],
        },
        {
          Action: [
            'cloudformation:DescribeStackResource',
            'cloudformation:SignalResource',
          ],
          Effect: 'Allow',
          Resource: {
            Ref: 'AWS::StackId',
          },
        },
      ],
    },
  });
});

test('Throw error on unsupported ebs volume type', () => {
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
      storageVolumeType: 'io2',
    },
  });
  // WHEN
  try {
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
    expect(error.message).toEqual('Invalid volume type provided, please provide any one of the following: '
    + 'standard, gp2, gp3');
  }
});

test('Test multi-node cluster with custom IAM Role', () => {
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
      customRoleArn: 'arn:aws:iam::12345678:role/customRoleName',
    },
  });

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

  // THEN
  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.resourceCountIs('AWS::IAM::Role', 0);
  infraTemplate.hasResourceProperties('AWS::IAM::InstanceProfile', {
    Roles: ['customRoleName'],
  });
});

test('Throw error on incorrect JSON', () => {
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
      additionalOsdConfig: '{ "something.enabled": "true", "something_else.enabled": "false" }',
      // eslint-disable-next-line max-len
      customConfigFiles: '{"test/data/config.yml": opensearch/config/opensearch-security/config.yml"}',
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
    expect(error.message).toContain('Encountered following error while parsing customConfigFiles json parameter:');
  }
});

test('Throw error when security is enabled and adminPassword is not defined and dist version is greater than or equal to 2.12', () => {
  const app = new App({
    context: {
      securityDisabled: false,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      distVersion: '3.0.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      managerNodeCount: 0,
      dataNodeCount: 3,
      dataNodeStorage: 200,
      customRoleArn: 'arn:aws:iam::12345678:role/customRoleName',
    },
  });

  try {
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
    expect(error.message).toEqual('adminPassword parameter is required to be set when security is enabled');
  }
});

test('Should not throw error when security is enabled and adminPassword is  defined and dist version is greater than or equal to 2.12', () => {
  const app = new App({
    context: {
      securityDisabled: false,
      adminPassword: 'Admin_1234',
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      distVersion: '2.12.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      managerNodeCount: 0,
      dataNodeCount: 3,
      dataNodeStorage: 200,
      customRoleArn: 'arn:aws:iam::12345678:role/customRoleName',
    },
  });

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
});

test('Should not throw error when security is enabled and version is less than 2.12', () => {
  const app = new App({
    context: {
      securityDisabled: false,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      distVersion: '2.4.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      managerNodeCount: 0,
      dataNodeCount: 3,
      dataNodeStorage: 200,
      customRoleArn: 'arn:aws:iam::12345678:role/customRoleName',
    },
  });

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
});

test('Test additionalConfig overriding values', () => {
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
      customRoleArn: 'arn:aws:iam::12345678:role/customRoleName',
      additionalConfig: '{ "cluster.name": "custom-cdk", "network.port": "8041" }',
      additionalOsdConfig: '{ "something.enabled": "true", "something_else.enabled": "false" }',
    },
  });

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

  // THEN
  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.resourceCountIs('AWS::IAM::Role', 0);
  infraTemplate.hasResource('AWS::AutoScaling::AutoScalingGroup', {
    /* eslint-disable max-len */
    Metadata: {
      'AWS::CloudFormation::Init': {
        config: {
          commands: {
            '012': {
              command: "set -ex; cd opensearch/config; echo \"cluster.name: custom-cdk\nnetwork.port: '8041'\n\">additionalConfig.yml; yq eval-all -i '. as $item ireduce ({}; . * $item)' opensearch.yml additionalConfig.yml -P",
              cwd: '/home/ec2-user',
              ignoreErrors: false,
            },
            '017': {
              command: "set -ex;cd opensearch-dashboards/config; echo \"something.enabled: 'true'\nsomething_else.enabled: 'false'\n\">additionalOsdConfig.yml; yq eval-all -i '. as $item ireduce ({}; . * $item)' opensearch_dashboards.yml additionalOsdConfig.yml -P",
              cwd: '/home/ec2-user',
              ignoreErrors: false,
            },
          },
        },
      },
    },
  });
});

test('Test certificate addition and port mapping', () => {
  const app = new App({
    context: {
      securityDisabled: false,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      distVersion: '1.0.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      certificateArn: 'arn:1234',
      mapOpensearchPortTo: '8440',
      mapOpensearchDashboardsPortTo: '443',
    },
  });

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

  // THEN
  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 8440,
    Protocol: 'TCP',
  });
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 443,
    Protocol: 'TLS',
    Certificates: [
      {
        CertificateArn: 'arn:1234',
      },
    ],
  });
});

test('Test default port mapping', () => {
  const app = new App({
    context: {
      securityDisabled: false,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      distVersion: '1.0.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
    },
  });

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

  // THEN
  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 443,
    Protocol: 'TCP',
  });
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 8443,
    Protocol: 'TCP',
  });
});

test('Ignore cert and TLS protocol if none of the ports map to 443', () => {
  const app = new App({
    context: {
      securityDisabled: false,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      distVersion: '1.0.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      certificateArn: 'arn:1234',
      mapOpensearchPortTo: '8440',
      mapOpensearchDashboardsPortTo: '8443',
    },
  });

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

  // THEN
  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 8440,
    Protocol: 'TCP',
  });
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
    Port: 8443,
    Protocol: 'TCP',
  });
});

test('Throw error on duplicate ports', () => {
  const app = new App({
    context: {
      securityDisabled: false,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      distVersion: '1.0.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      certificateArn: 'arn:1234',
      mapOpensearchPortTo: '8443',
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
    expect(error.message).toEqual('OpenSearch and OpenSearch-Dashboards cannot be mapped to the same port! Please provide different port numbers. Current mapping is OpenSearch:8443 OpenSearch-Dashboards:8443');
  }
});

test('Ensure target group protocol is always TCP', () => {
  const app = new App({
    context: {
      securityDisabled: false,
      minDistribution: false,
      distributionUrl: 'www.example.com',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 'www.example.com',
      distVersion: '1.0.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      certificateArn: 'arn:1234',
      mapOpensearchPortTo: '8440',
      mapOpensearchDashboardsPortTo: '443',
    },
  });

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

  // THEN
  const infraTemplate = Template.fromStack(infraStack);
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
    Port: 9200,
    Protocol: 'TCP',
    TargetType: 'instance',
  });
  infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
    Port: 5601,
    Protocol: 'TCP',
    TargetType: 'instance',
  });
});

test('Test S3 distribution URL support for OpenSearch in single-node cluster', () => {
  const app = new App({
    context: {
      securityDisabled: true,
      minDistribution: false,
      distributionUrl: 's3://test-bucket/opensearch-2.11.0-linux-x64.tar.gz',
      cpuArch: 'x64',
      singleNodeCluster: true,
      dashboardsUrl: 'https://artifacts.opensearch.org/releases/bundle/opensearch-dashboards/2.11.0/opensearch-dashboards-2.11.0-linux-x64.tar.gz',
      distVersion: '2.11.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      enableMonitoring: false,
    },
  });

  // WHEN
  const netStack = new NetworkStack(app, 'opensearch-network-stack', {
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // @ts-ignore
  const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
    vpc: netStack.vpc,
    securityGroup: netStack.osSecurityGroup,
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // THEN
  const infraTemplate = Template.fromStack(infraStack);
  
  // Verify that the instance has S3 read permissions
  infraTemplate.hasResourceProperties('AWS::IAM::Role', {
    ManagedPolicyArns: [
      {
        'Fn::Join': [
          '',
          [
            'arn:',
            { Ref: 'AWS::Partition' },
            ':iam::aws:policy/AmazonEC2ReadOnlyAccess',
          ],
        ],
      },
      {
        'Fn::Join': [
          '',
          [
            'arn:',
            { Ref: 'AWS::Partition' },
            ':iam::aws:policy/CloudWatchAgentServerPolicy',
          ],
        ],
      },
      {
        'Fn::Join': [
          '',
          [
            'arn:',
            { Ref: 'AWS::Partition' },
            ':iam::aws:policy/AmazonSSMManagedInstanceCore',
          ],
        ],
      },
      {
        'Fn::Join': [
          '',
          [
            'arn:',
            { Ref: 'AWS::Partition' },
            ':iam::aws:policy/AmazonS3ReadOnlyAccess',
          ],
        ],
      },
    ],
  });
  
  // Verify that the CloudFormation Init contains download commands with S3 URL
  const template = infraTemplate.toJSON();
  const instanceResource = Object.values(template.Resources).find((resource: any) => 
    resource.Type === 'AWS::EC2::Instance'
  ) as any;
  
  const commands = instanceResource.Metadata['AWS::CloudFormation::Init'].config.commands;
  const downloadCommand = Object.values(commands).find((cmd: any) => 
    cmd.command && cmd.command.includes('aws s3 cp') && cmd.command.includes('s3://test-bucket/opensearch-2.11.0-linux-x64.tar.gz')
  );
  expect(downloadCommand).toBeDefined();
});

test('Test S3 distribution URL support for OpenSearch Dashboards in single-node cluster', () => {
  const app = new App({
    context: {
      securityDisabled: true,
      minDistribution: false,
      distributionUrl: 'https://artifacts.opensearch.org/releases/bundle/opensearch/2.11.0/opensearch-2.11.0-linux-x64.tar.gz',
      cpuArch: 'x64',
      singleNodeCluster: true,
      dashboardsUrl: 's3://test-bucket/opensearch-dashboards-2.11.0-linux-x64.tar.gz',
      distVersion: '2.11.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      enableMonitoring: false,
    },
  });

  // WHEN
  const netStack = new NetworkStack(app, 'opensearch-network-stack', {
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // @ts-ignore
  const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
    vpc: netStack.vpc,
    securityGroup: netStack.osSecurityGroup,
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // THEN
  const infraTemplate = Template.fromStack(infraStack);
  
  // Verify that the CloudFormation Init contains download commands for dashboards with S3 URL
  const template = infraTemplate.toJSON();
  const instanceResource = Object.values(template.Resources).find((resource: any) => 
    resource.Type === 'AWS::EC2::Instance'
  ) as any;
  
  const commands = instanceResource.Metadata['AWS::CloudFormation::Init'].config.commands;
  const downloadCommand = Object.values(commands).find((cmd: any) => 
    cmd.command && cmd.command.includes('aws s3 cp') && cmd.command.includes('s3://test-bucket/opensearch-dashboards-2.11.0-linux-x64.tar.gz')
  );
  expect(downloadCommand).toBeDefined();
});

test('Test both S3 distribution URLs for OpenSearch and Dashboards in single-node cluster', () => {
  const app = new App({
    context: {
      securityDisabled: true,
      minDistribution: false,
      distributionUrl: 's3://test-bucket/opensearch-2.11.0-linux-x64.tar.gz',
      cpuArch: 'x64',
      singleNodeCluster: true,
      dashboardsUrl: 's3://test-bucket/opensearch-dashboards-2.11.0-linux-x64.tar.gz',
      distVersion: '2.11.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      enableMonitoring: false,
    },
  });

  // WHEN
  const netStack = new NetworkStack(app, 'opensearch-network-stack', {
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // @ts-ignore
  const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
    vpc: netStack.vpc,
    securityGroup: netStack.osSecurityGroup,
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // THEN
  const infraTemplate = Template.fromStack(infraStack);
  
  const template = infraTemplate.toJSON();
  const instanceResource = Object.values(template.Resources).find((resource: any) => 
    resource.Type === 'AWS::EC2::Instance'
  ) as any;
  
  const commands = instanceResource.Metadata['AWS::CloudFormation::Init'].config.commands;
  
  // Check OpenSearch download command
  const opensearchCommand = Object.values(commands).find((cmd: any) => 
    cmd.command && cmd.command.includes('aws s3 cp') && cmd.command.includes('s3://test-bucket/opensearch-2.11.0-linux-x64.tar.gz')
  );
  expect(opensearchCommand).toBeDefined();
  
  // Check Dashboards download command
  const dashboardsCommand = Object.values(commands).find((cmd: any) => 
    cmd.command && cmd.command.includes('aws s3 cp') && cmd.command.includes('s3://test-bucket/opensearch-dashboards-2.11.0-linux-x64.tar.gz')
  );
  expect(dashboardsCommand).toBeDefined();
});

test('Test S3 distribution URL support in multi-node cluster', () => {
  const app = new App({
    context: {
      securityDisabled: true,
      minDistribution: false,
      distributionUrl: 's3://test-bucket/opensearch-2.11.0-linux-x64.tar.gz',
      cpuArch: 'x64',
      singleNodeCluster: false,
      dashboardsUrl: 's3://test-bucket/opensearch-dashboards-2.11.0-linux-x64.tar.gz',
      distVersion: '2.11.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      enableMonitoring: false,
      managerNodeCount: 3,
      dataNodeCount: 2,
    },
  });

  // WHEN
  const netStack = new NetworkStack(app, 'opensearch-network-stack', {
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // @ts-ignore
  const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
    vpc: netStack.vpc,
    securityGroup: netStack.osSecurityGroup,
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // THEN
  const infraTemplate = Template.fromStack(infraStack);
  
  // Verify that Auto Scaling Groups are created
  infraTemplate.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 3);
  
  // Verify that all ASGs have the S3 download commands in their metadata
  const template = infraTemplate.toJSON();
  const asgResources = Object.values(template.Resources).filter((resource: any) => 
    resource.Type === 'AWS::AutoScaling::AutoScalingGroup'
  ) as any[];
  
  asgResources.forEach((asg) => {
    const commands = asg.Metadata['AWS::CloudFormation::Init'].config.commands;
    
    // Check that download command exists
    const downloadCommand = Object.values(commands).find((cmd: any) => 
      cmd.command && cmd.command.includes('aws s3 cp') && cmd.command.includes('s3://test-bucket/opensearch-2.11.0-linux-x64.tar.gz')
    );
    expect(downloadCommand).toBeDefined();
  });
});


test('Test S3 distribution URL with security enabled', () => {
  const app = new App({
    context: {
      securityDisabled: false,
      adminPassword: 'Admin_1234',
      minDistribution: false,
      distributionUrl: 's3://test-bucket/opensearch-2.11.0-linux-x64.tar.gz',
      cpuArch: 'x64',
      singleNodeCluster: true,
      dashboardsUrl: 's3://test-bucket/opensearch-dashboards-2.11.0-linux-x64.tar.gz',
      distVersion: '2.11.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      enableMonitoring: false,
    },
  });

  // WHEN
  const netStack = new NetworkStack(app, 'opensearch-network-stack', {
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // @ts-ignore
  const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
    vpc: netStack.vpc,
    securityGroup: netStack.osSecurityGroup,
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // THEN
  const infraTemplate = Template.fromStack(infraStack);
  
  // Verify that the instance is created and has S3 permissions
  infraTemplate.resourceCountIs('AWS::EC2::Instance', 1);
  infraTemplate.hasResourceProperties('AWS::IAM::Role', {
    ManagedPolicyArns: [
      {
        'Fn::Join': [
          '',
          [
            'arn:',
            { Ref: 'AWS::Partition' },
            ':iam::aws:policy/AmazonEC2ReadOnlyAccess',
          ],
        ],
      },
      {
        'Fn::Join': [
          '',
          [
            'arn:',
            { Ref: 'AWS::Partition' },
            ':iam::aws:policy/CloudWatchAgentServerPolicy',
          ],
        ],
      },
      {
        'Fn::Join': [
          '',
          [
            'arn:',
            { Ref: 'AWS::Partition' },
            ':iam::aws:policy/AmazonSSMManagedInstanceCore',
          ],
        ],
      },
      {
        'Fn::Join': [
          '',
          [
            'arn:',
            { Ref: 'AWS::Partition' },
            ':iam::aws:policy/AmazonS3ReadOnlyAccess',
          ],
        ],
      },
    ],
  });
});

test('Test S3 distribution URL with custom IAM role', () => {
  const app = new App({
    context: {
      securityDisabled: true,
      minDistribution: false,
      distributionUrl: 's3://test-bucket/opensearch-2.11.0-linux-x64.tar.gz',
      cpuArch: 'x64',
      singleNodeCluster: true,
      dashboardsUrl: 's3://test-bucket/opensearch-dashboards-2.11.0-linux-x64.tar.gz',
      distVersion: '2.11.0',
      serverAccessType: 'ipv4',
      restrictServerAccessTo: 'all',
      enableMonitoring: false,
      customRoleArn: 'arn:aws:iam::123456789012:role/CustomOpenSearchRole',
    },
  });

  // WHEN
  const netStack = new NetworkStack(app, 'opensearch-network-stack', {
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // @ts-ignore
  const infraStack = new InfraStack(app, 'opensearch-infra-stack', {
    vpc: netStack.vpc,
    securityGroup: netStack.osSecurityGroup,
    env: { account: 'test-account', region: 'us-east-1' },
  });

  // THEN
  const infraTemplate = Template.fromStack(infraStack);
  
  // Verify that no new IAM role is created (using custom role)
  infraTemplate.resourceCountIs('AWS::IAM::Role', 0);
  
  // Verify that the instance profile uses the custom role
  infraTemplate.hasResourceProperties('AWS::IAM::InstanceProfile', {
    Roles: ['CustomOpenSearchRole'],
  });
  
  // Verify download commands are still present
  const template = infraTemplate.toJSON();
  const instanceResource = Object.values(template.Resources).find((resource: any) => 
    resource.Type === 'AWS::EC2::Instance'
  ) as any;
  
  const commands = instanceResource.Metadata['AWS::CloudFormation::Init'].config.commands;
  const downloadCommand = Object.values(commands).find((cmd: any) => 
    cmd.command && cmd.command.includes('aws s3 cp') && cmd.command.includes('s3://test-bucket/opensearch-2.11.0-linux-x64.tar.gz')
  );
  expect(downloadCommand).toBeDefined();
});

describe.each([
  {
    loadBalancerType: 'alb', securityDisabled: false, expectedType: 'application', expectedProtocol: 'HTTPS',
  },
  {
    loadBalancerType: 'alb', securityDisabled: true, expectedType: 'application', expectedProtocol: 'HTTP',
  },
  {
    loadBalancerType: 'nlb', securityDisabled: false, expectedType: 'network', expectedProtocol: 'TLS',
  },
  {
    loadBalancerType: 'nlb', securityDisabled: true, expectedType: 'network', expectedProtocol: 'TCP',
  },
])('Test $loadBalancerType creation with securityDisabled=$securityDisabled', ({
  loadBalancerType, securityDisabled, expectedType, expectedProtocol,
}) => {
  test(`should create ${loadBalancerType} with securityDisabled=${securityDisabled}`, () => {
    const app = new App({
      context: {
        securityDisabled,
        certificateArn: (securityDisabled) ? undefined : 'arn:1234',
        minDistribution: false,
        distributionUrl: 'www.example.com',
        cpuArch: 'x64',
        singleNodeCluster: false,
        dashboardsUrl: 'www.example.com',
        distVersion: '1.0.0',
        serverAccessType: 'ipv4',
        restrictServerAccessTo: 'all',
        loadBalancerType,
      },
    });

    // WHEN
    const networkStack = new NetworkStack(app, 'opensearch-network-stack', {
      env: { account: 'test-account', region: 'us-east-1' },
    });

    const infraStack = new InfraStack(app as unknown as Stack, 'opensearch-infra-stack', {
      vpc: networkStack.vpc,
      securityGroup: networkStack.osSecurityGroup,
      env: { account: 'test-account', region: 'us-east-1' },
    });

    // THEN
    const infraTemplate = Template.fromStack(infraStack);
    infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Type: expectedType,
    });

    infraTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Protocol: expectedProtocol,
    });
  });
});
