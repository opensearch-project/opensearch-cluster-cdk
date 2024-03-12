/* Copyright OpenSearch Contributors
SPDX-License-Identifier: Apache-2.0

The OpenSearch Contributors require contributions made to
this file be licensed under the Apache-2.0 license or a
compatible open source license. */

import {
  CfnOutput, RemovalPolicy, Stack, StackProps, Tags,
} from 'aws-cdk-lib';
import {
  AutoScalingGroup, BlockDeviceVolume, EbsDeviceVolumeType, Signals,
} from 'aws-cdk-lib/aws-autoscaling';
import { Unit } from 'aws-cdk-lib/aws-cloudwatch';
import {
  AmazonLinuxCpuType,
  AmazonLinuxGeneration,
  CloudFormationInit,
  ISecurityGroup,
  IVpc,
  InitCommand,
  InitElement,
  InitPackage,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  MachineImage,
  SubnetType,
} from 'aws-cdk-lib/aws-ec2';
import {
  ListenerCertificate,
  NetworkListener, NetworkLoadBalancer, Protocol,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { InstanceTarget } from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import {
  ManagedPolicy, Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { readFileSync } from 'fs';
import { dump, load } from 'js-yaml';
import { join } from 'path';
import { satisfies } from 'semver';
import { CloudwatchAgent } from '../cloudwatch/cloudwatch-agent';
import { ProcstatMetricDefinition } from '../cloudwatch/metrics-section';
import { InfraStackMonitoring } from '../monitoring/alarms';
import {
  getArm64InstanceTypes, getVolumeType, getX64InstanceTypes, nodeConfig,
} from '../opensearch-config/node-config';
import { RemoteStoreResources } from './remote-store-resources';

enum cpuArchEnum{
  X64='x64',
  ARM64='arm64'
}

const getInstanceType = (instanceType: string, arch: string) => {
  if (arch === 'x64') {
    if (instanceType !== 'undefined') {
      return getX64InstanceTypes(instanceType);
    }
    return getX64InstanceTypes('r5.xlarge');
  }
  if (instanceType !== 'undefined') {
    return getArm64InstanceTypes(instanceType);
  }
  return getArm64InstanceTypes('r6g.xlarge');
};

export interface InfraProps extends StackProps {
  /** VPC used for deploying all resources */
  readonly vpc: IVpc,
  /** Security group required for all resources */
  readonly securityGroup: ISecurityGroup,
  /** OpenSearch Distribution version */
  readonly distVersion?: string,
  /** CPU architecture to deploy all EC2 */
  readonly cpuArch?: string,
  /** Security enabled or disabled for the cluster */
  readonly securityDisabled?: boolean,
  /** Admin password for your cluster */
  readonly adminPassword?: string,
  /** Whether it is a min distribution */
  readonly minDistribution?: boolean,
  /** URL to download OpenSearch distribution from */
  readonly distributionUrl?: string,
  /** URL to download opensearch dashboards distribution from */
  readonly dashboardsUrl?: string,
  /** Whether it is a single node cluster */
  readonly singleNodeCluster?: boolean,
  /** Number of manager nodes */
  readonly managerNodeCount?: number,
  /** Number of data nodes */
  readonly dataNodeCount?: number,
  /** Number of ingest nodes */
  readonly ingestNodeCount?: number,
  /** Number of client nodes */
  readonly clientNodeCount?: number,
  /** Number of ml modes */
  readonly mlNodeCount?: number,
  /** EBS block storage size for data nodes */
  readonly dataNodeStorage?: number,
  /** EBS block storage size for ml nodes */
  readonly mlNodeStorage?: number,
  /** EC2 instance type for data nodes */
  readonly dataInstanceType?: InstanceType,
  /** EC2 instance type for ML nodes */
  readonly mlInstanceType?: InstanceType,
  /** Whether to use 50% heap */
  readonly use50PercentHeap?: boolean,
  /** Whether the cluster should be internal only */
  readonly isInternal?: boolean,
  /** Whether to enable remote store feature */
  readonly enableRemoteStore?: boolean,
  /** EBS volume type for all nodes */
  readonly storageVolumeType?: EbsDeviceVolumeType,
  /** Custom role to use as EC2 instance profile */
  readonly customRoleArn?: string,
  /** JVM system properties */
  readonly jvmSysProps?: string,
  /** Any additional config to add to opensearch.yml */
  readonly additionalConfig?: string,
  /** Any additional config to add to opensearch-dashboards.yml */
  readonly additionalOsdConfig?: string,
  /** Add any custom configuration files to the cluster */
  readonly customConfigFiles?: string,
  /** Whether to enable monioring with alarms */
  readonly enableMonitoring?: boolean,
   /** Certificate ARN to attach to the listener */
   readonly certificateArn ?: string
   /** Map opensearch port on load balancer to */
   readonly mapOpensearchPortTo ?: number
   /** Map opensearch-dashboards port on load balancer to */
   readonly mapOpensearchDashboardsPortTo ?: number
}

export class InfraStack extends Stack {
  private instanceRole: Role;

  private distVersion: string;

  private cpuArch: string;

  private securityDisabled: boolean;

  private adminPassword: string;

  private minDistribution: boolean;

  private distributionUrl: string;

  private dashboardsUrl: string;

  private singleNodeCluster: boolean;

  private managerNodeCount: number;

  private dataNodeCount: number | string;

  private ingestNodeCount: number | string;

  private clientNodeCount: number | string;

  private mlNodeCount: number | string;

  private dataNodeStorage: number;

  private mlNodeStorage: number;

  private dataInstanceType: InstanceType;

  private mlInstanceType: InstanceType;

  private use50PercentHeap: boolean;

  private isInternal: boolean;

  private enableRemoteStore: boolean;

  private storageVolumeType: EbsDeviceVolumeType;

  private customRoleArn: string;

  private jvmSysProps: string;

  private additionalConfig: string;

  private additionalOsdConfig: string;

  private customConfigFiles: string;

  private enableMonitoring: boolean;

  private opensearchPortMapping: number;

  private opensearchDashboardsPortMapping: number;

  constructor(scope: Stack, id: string, props: InfraProps) {
    super(scope, id, props);
    let dashboardsListener: NetworkListener;
    let managerAsgCapacity: number;
    let dataAsgCapacity: number;
    let clientNodeAsg: AutoScalingGroup;
    let seedConfig: string;
    let singleNodeInstance: Instance;
    let instanceCpuType: AmazonLinuxCpuType;

    // Properties and context variables checks
    this.distVersion = `${props?.distVersion ?? scope.node.tryGetContext('distVersion')}`;
    if (this.distVersion.toString() === 'undefined') {
      throw new Error('distVersion parameter cannot be empty! Please provide the OpenSearch distribution version');
    }

    const securityDisabled = `${props?.securityDisabled ?? scope.node.tryGetContext('securityDisabled')}`;
    if (securityDisabled !== 'true' && securityDisabled !== 'false') {
      throw new Error('securityDisabled parameter is required to be set as - true or false');
    }
    this.securityDisabled = securityDisabled === 'true';

    this.adminPassword = this.securityDisabled ? '' : `${props?.adminPassword ?? scope.node.tryGetContext('adminPassword')}`;
    if (!this.securityDisabled && satisfies(this.distVersion, '>=2.12.0') && this.adminPassword === 'undefined') {
      throw new Error('adminPassword parameter is required to be set when security is enabled');
    }

    const minDistribution = `${props?.minDistribution ?? scope.node.tryGetContext('minDistribution')}`;
    if (minDistribution !== 'true' && minDistribution !== 'false') {
      throw new Error('minDistribution parameter is required to be set as - true or false');
    } else {
      this.minDistribution = minDistribution === 'true';
    }

    this.distributionUrl = `${props?.distributionUrl ?? scope.node.tryGetContext('distributionUrl')}`;
    if (this.distributionUrl.toString() === 'undefined') {
      throw new Error('distributionUrl parameter is required. Please provide the OpenSearch distribution artifact url to download');
    }

    this.dashboardsUrl = `${props?.dashboardsUrl ?? scope.node.tryGetContext('dashboardsUrl')}`;
    const dataInstanceType: InstanceType | string = `${props?.dataInstanceType ?? scope.node.tryGetContext('dataInstanceType')}`;
    const mlInstanceType: InstanceType | string = `${props?.mlInstanceType ?? scope.node.tryGetContext('mlInstanceType')}`;

    this.cpuArch = `${props?.cpuArch ?? scope.node.tryGetContext('cpuArch')}`;
    if (this.cpuArch === 'undefined') {
      throw new Error('cpuArch parameter is required. Valid inputs: x64 or arm64');
      // @ts-ignore
    } else if (Object.values(cpuArchEnum).includes(this.cpuArch.toString())) {
      if (this.cpuArch.toString() === cpuArchEnum.X64) {
        instanceCpuType = AmazonLinuxCpuType.X86_64;
        this.dataInstanceType = getInstanceType(dataInstanceType, this.cpuArch.toString());
        this.mlInstanceType = getInstanceType(mlInstanceType, this.cpuArch.toString());
      } else {
        instanceCpuType = AmazonLinuxCpuType.ARM_64;
        this.dataInstanceType = getInstanceType(dataInstanceType, this.cpuArch.toString());
        this.mlInstanceType = getInstanceType(mlInstanceType, this.cpuArch.toString());
      }
    } else {
      throw new Error('Please provide a valid cpu architecture. The valid value can be either x64 or arm64');
    }

    const singleNodeCluster = `${props?.singleNodeCluster ?? scope.node.tryGetContext('singleNodeCluster')}`;
    this.singleNodeCluster = singleNodeCluster === 'true';

    const managerCount = `${props?.managerNodeCount ?? scope.node.tryGetContext('managerNodeCount')}`;
    if (managerCount === 'undefined') {
      this.managerNodeCount = 3;
    } else {
      this.managerNodeCount = parseInt(managerCount, 10);
    }

    const dataNode = `${props?.dataNodeCount ?? scope.node.tryGetContext('dataNodeCount')}`;
    if (dataNode === 'undefined') {
      this.dataNodeCount = 2;
    } else {
      this.dataNodeCount = parseInt(dataNode, 10);
    }

    const clientNode = `${props?.clientNodeCount ?? scope.node.tryGetContext('clientNodeCount')}`;
    if (clientNode === 'undefined') {
      this.clientNodeCount = 0;
    } else {
      this.clientNodeCount = parseInt(clientNode, 10);
    }

    const ingestNode = `${props?.ingestNodeCount ?? scope.node.tryGetContext('ingestNodeCount')}`;
    if (ingestNode === 'undefined') {
      this.ingestNodeCount = 0;
    } else {
      this.ingestNodeCount = parseInt(ingestNode, 10);
    }

    const mlNode = `${props?.mlNodeCount ?? scope.node.tryGetContext('mlNodeCount')}`;
    if (mlNode === 'undefined') {
      this.mlNodeCount = 0;
    } else {
      this.mlNodeCount = parseInt(mlNode, 10);
    }

    const dataStorage = `${props?.dataNodeStorage ?? scope.node.tryGetContext('dataNodeStorage')}`;
    if (dataStorage === 'undefined') {
      this.dataNodeStorage = 100;
    } else {
      this.dataNodeStorage = parseInt(dataStorage, 10);
    }

    const storageVolType = `${props?.storageVolumeType ?? scope.node.tryGetContext('storageVolumeType')}`;
    if (storageVolType === 'undefined') {
      // use gp2 volume by default
      this.storageVolumeType = getVolumeType('gp2');
    } else {
      this.storageVolumeType = getVolumeType(storageVolType);
    }

    const mlStorage = `${props?.mlNodeStorage ?? scope.node.tryGetContext('mlNodeStorage')}`;
    if (mlStorage === 'undefined') {
      this.mlNodeStorage = 100;
    } else {
      this.mlNodeStorage = parseInt(mlStorage, 10);
    }

    this.jvmSysProps = `${props?.jvmSysProps ?? scope.node.tryGetContext('jvmSysProps')}`;

    const additionalConf = `${props?.additionalConfig ?? scope.node.tryGetContext('additionalConfig')}`;
    if (additionalConf !== 'undefined') {
      try {
        const jsonObj = JSON.parse(additionalConf);
        this.additionalConfig = dump(jsonObj);
      } catch (e) {
        throw new Error(`Encountered following error while parsing additionalConfig json parameter: ${e}`);
      }
    } else {
      this.additionalConfig = additionalConf;
    }

    const additionalOsdConf = `${props?.additionalOsdConfig ?? scope.node.tryGetContext('additionalOsdConfig')}`;
    if (additionalOsdConf.toString() !== 'undefined') {
      try {
        const jsonObj = JSON.parse(additionalOsdConf);
        this.additionalOsdConfig = dump(jsonObj);
      } catch (e) {
        throw new Error(`Encountered following error while parsing additionalOsdConfig json parameter: ${e}`);
      }
    } else {
      this.additionalOsdConfig = additionalOsdConf;
    }

    this.customConfigFiles = `${props?.customConfigFiles ?? scope.node.tryGetContext('customConfigFiles')}`;

    const use50heap = `${props?.use50PercentHeap ?? scope.node.tryGetContext('use50PercentHeap')}`;
    this.use50PercentHeap = use50heap === 'true';

    const nlbScheme = `${props.isInternal ?? scope.node.tryGetContext('isInternal')}`;
    this.isInternal = nlbScheme === 'true';

    const monitoringAndAlarms = `${props?.enableMonitoring ?? scope.node.tryGetContext('enableMonitoring')}`;
    this.enableMonitoring = monitoringAndAlarms === 'true';

    this.customRoleArn = `${props?.customRoleArn ?? scope.node.tryGetContext('customRoleArn')}`;
    if (this.customRoleArn === 'undefined') {
      this.instanceRole = new Role(this, 'instanceRole', {
        managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ReadOnlyAccess'),
          ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
          ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')],
        assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      });
    } else {
      this.instanceRole = <Role>Role.fromRoleArn(this, 'custom-role-arn', `${this.customRoleArn}`);
    }

    const remoteStore = `${props?.enableRemoteStore ?? scope.node.tryGetContext('enableRemoteStore')}`;
    this.enableRemoteStore = remoteStore === 'true';
    if (this.enableRemoteStore) {
      // Remote Store needs an S3 bucket to be registered as snapshot repo
      // Add scoped bucket policy to the instance role attached to the EC2
      const remoteStoreObj = new RemoteStoreResources(this);
      this.instanceRole.addToPolicy(remoteStoreObj.getRemoteStoreBucketPolicy());
    }

    const clusterLogGroup = new LogGroup(this, 'opensearchLogGroup', {
      logGroupName: `${id}LogGroup/opensearch.log`,
      retention: RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    let singleNodeInstanceType: InstanceType;
    if (dataInstanceType) {
      singleNodeInstanceType = this.dataInstanceType;
    } else if (instanceCpuType === AmazonLinuxCpuType.X86_64) {
      singleNodeInstanceType = InstanceType.of(InstanceClass.R5, InstanceSize.XLARGE);
    } else {
      singleNodeInstanceType = InstanceType.of(InstanceClass.R6G, InstanceSize.XLARGE);
    }

    const defaultInstanceType = (instanceCpuType === AmazonLinuxCpuType.X86_64)
      ? InstanceType.of(InstanceClass.C5, InstanceSize.XLARGE) : InstanceType.of(InstanceClass.C6G, InstanceSize.XLARGE);

    const certificateArn = `${props?.certificateArn ?? scope.node.tryGetContext('certificateArn')}`;

    const nlb = new NetworkLoadBalancer(this, 'clusterNlb', {
      vpc: props.vpc,
      internetFacing: (!this.isInternal),
      crossZoneEnabled: true,
    });

    const opensearchPortMap = `${props?.mapOpensearchPortTo ?? scope.node.tryGetContext('mapOpensearchPortTo')}`;
    if (opensearchPortMap === 'undefined') {
      if (!this.securityDisabled && !this.minDistribution) {
        this.opensearchPortMapping = 443;
      } else {
        this.opensearchPortMapping = 80;
      }
    } else {
      this.opensearchPortMapping = parseInt(opensearchPortMap, 10);
    }

    const opensearchListener = nlb.addListener('opensearch', {
      port: this.opensearchPortMapping,
      protocol: Protocol.TCP,
    });
    if (!this.securityDisabled && !this.minDistribution) {
      if (certificateArn !== 'undefined') {
        opensearchListener.addCertificates('cert', [ListenerCertificate.fromArn(certificateArn)]);
      }
    }

    const opensearchDashboardsPortMap = `${props?.mapOpensearchDashboardsPortTo ?? scope.node.tryGetContext('mapOpensearchDashboardsPortTo')}`;
    if (opensearchDashboardsPortMap === 'undefined') {
      this.opensearchDashboardsPortMapping = 8443;
    } else {
      this.opensearchDashboardsPortMapping = parseInt(opensearchDashboardsPortMap, 10);
    }

    if (this.dashboardsUrl !== 'undefined') {
      dashboardsListener = nlb.addListener('dashboards', {
        port: this.opensearchDashboardsPortMapping,
        protocol: Protocol.TCP,
      });
    }

    if (this.singleNodeCluster) {
      console.log('Single node value is true, creating single node configurations');
      singleNodeInstance = new Instance(this, 'single-node-instance', {
        vpc: props.vpc,
        instanceType: singleNodeInstanceType,
        machineImage: MachineImage.latestAmazonLinux({
          generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
          cpuType: instanceCpuType,
        }),
        role: this.instanceRole,
        vpcSubnets: {
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroup: props.securityGroup,
        blockDevices: [{
          deviceName: '/dev/xvda',
          volume: BlockDeviceVolume.ebs(this.dataNodeStorage, { deleteOnTermination: true, volumeType: this.storageVolumeType }),
        }],
        init: CloudFormationInit.fromElements(...this.getCfnInitElement(this, clusterLogGroup)),
        initOptions: {
          ignoreFailures: false,
        },
        requireImdsv2: true,
      });
      Tags.of(singleNodeInstance).add('role', 'client');

      opensearchListener.addTargets('single-node-target', {
        port: 9200,
        targets: [new InstanceTarget(singleNodeInstance)],
      });

      if (this.dashboardsUrl !== 'undefined') {
        // @ts-ignore
        dashboardsListener.addTargets('single-node-osd-target', {
          port: 5601,
          targets: [new InstanceTarget(singleNodeInstance)],
        });
      }
      new CfnOutput(this, 'private-ip', {
        value: singleNodeInstance.instancePrivateIp,
      });
    } else {
      if (this.managerNodeCount > 0) {
        managerAsgCapacity = this.managerNodeCount - 1;
        dataAsgCapacity = this.dataNodeCount;
      } else {
        managerAsgCapacity = this.managerNodeCount;
        dataAsgCapacity = this.dataNodeCount - 1;
      }

      if (managerAsgCapacity > 0) {
        const managerNodeAsg = new AutoScalingGroup(this, 'managerNodeAsg', {
          vpc: props.vpc,
          instanceType: defaultInstanceType,
          machineImage: MachineImage.latestAmazonLinux({
            generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
            cpuType: instanceCpuType,
          }),
          role: this.instanceRole,
          maxCapacity: managerAsgCapacity,
          minCapacity: managerAsgCapacity,
          desiredCapacity: managerAsgCapacity,
          vpcSubnets: {
            subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          },
          securityGroup: props.securityGroup,
          blockDevices: [{
            deviceName: '/dev/xvda',
            volume: BlockDeviceVolume.ebs(50, { deleteOnTermination: true, volumeType: props.storageVolumeType }),
          }],
          init: CloudFormationInit.fromElements(...this.getCfnInitElement(this, clusterLogGroup, 'manager')),
          initOptions: {
            ignoreFailures: false,
          },
          requireImdsv2: true,
          signals: Signals.waitForAll(),
        });
        Tags.of(managerNodeAsg).add('role', 'manager');

        seedConfig = 'seed-manager';
      } else {
        seedConfig = 'seed-data';
      }

      const seedNodeAsg = new AutoScalingGroup(this, 'seedNodeAsg', {
        vpc: props.vpc,
        instanceType: (seedConfig === 'seed-manager') ? defaultInstanceType : this.dataInstanceType,
        machineImage: MachineImage.latestAmazonLinux({
          generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
          cpuType: instanceCpuType,
        }),
        role: this.instanceRole,
        maxCapacity: 1,
        minCapacity: 1,
        desiredCapacity: 1,
        vpcSubnets: {
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroup: props.securityGroup,
        blockDevices: [{
          deviceName: '/dev/xvda',
          // eslint-disable-next-line max-len
          volume: (seedConfig === 'seed-manager') ? BlockDeviceVolume.ebs(50, { deleteOnTermination: true, volumeType: props.storageVolumeType }) : BlockDeviceVolume.ebs(this.dataNodeStorage, { deleteOnTermination: true, volumeType: this.storageVolumeType }),
        }],
        init: CloudFormationInit.fromElements(...this.getCfnInitElement(this, clusterLogGroup, seedConfig)),
        initOptions: {
          ignoreFailures: false,
        },
        requireImdsv2: true,
        signals: Signals.waitForAll(),
      });
      Tags.of(seedNodeAsg).add('role', 'manager');

      const dataNodeAsg = new AutoScalingGroup(this, 'dataNodeAsg', {
        vpc: props.vpc,
        instanceType: this.dataInstanceType,
        machineImage: MachineImage.latestAmazonLinux({
          generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
          cpuType: instanceCpuType,
        }),
        role: this.instanceRole,
        maxCapacity: dataAsgCapacity,
        minCapacity: dataAsgCapacity,
        desiredCapacity: dataAsgCapacity,
        vpcSubnets: {
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroup: props.securityGroup,
        blockDevices: [{
          deviceName: '/dev/xvda',
          volume: BlockDeviceVolume.ebs(this.dataNodeStorage, { deleteOnTermination: true, volumeType: this.storageVolumeType }),
        }],
        init: CloudFormationInit.fromElements(...this.getCfnInitElement(this, clusterLogGroup, 'data')),
        initOptions: {
          ignoreFailures: false,
        },
        requireImdsv2: true,
        signals: Signals.waitForAll(),
      });
      Tags.of(dataNodeAsg).add('role', 'data');

      if (this.clientNodeCount === 0) {
        clientNodeAsg = dataNodeAsg;
      } else {
        clientNodeAsg = new AutoScalingGroup(this, 'clientNodeAsg', {
          vpc: props.vpc,
          instanceType: defaultInstanceType,
          machineImage: MachineImage.latestAmazonLinux({
            generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
            cpuType: instanceCpuType,
          }),
          role: this.instanceRole,
          maxCapacity: this.clientNodeCount,
          minCapacity: this.clientNodeCount,
          desiredCapacity: this.clientNodeCount,
          vpcSubnets: {
            subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          },
          securityGroup: props.securityGroup,
          blockDevices: [{
            deviceName: '/dev/xvda',
            volume: BlockDeviceVolume.ebs(50, { deleteOnTermination: true, volumeType: this.storageVolumeType }),
          }],
          init: CloudFormationInit.fromElements(...this.getCfnInitElement(this, clusterLogGroup, 'client')),
          initOptions: {
            ignoreFailures: false,
          },
          requireImdsv2: true,
          signals: Signals.waitForAll(),
        });
        Tags.of(clientNodeAsg).add('cluster', scope.stackName);
      }

      Tags.of(clientNodeAsg).add('role', 'client');

      if (this.mlNodeCount > 0) {
        const mlNodeAsg = new AutoScalingGroup(this, 'mlNodeAsg', {
          vpc: props.vpc,
          instanceType: this.mlInstanceType,
          machineImage: MachineImage.latestAmazonLinux({
            generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
            cpuType: instanceCpuType,
          }),
          role: this.instanceRole,
          maxCapacity: this.mlNodeCount,
          minCapacity: this.mlNodeCount,
          desiredCapacity: this.mlNodeCount,
          vpcSubnets: {
            subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          },
          securityGroup: props.securityGroup,
          blockDevices: [{
            deviceName: '/dev/xvda',
            volume: BlockDeviceVolume.ebs(this.mlNodeStorage, { deleteOnTermination: true, volumeType: this.storageVolumeType }),
          }],
          init: CloudFormationInit.fromElements(...this.getCfnInitElement(this, clusterLogGroup, 'ml')),
          initOptions: {
            ignoreFailures: false,
          },
          requireImdsv2: true,
          signals: Signals.waitForAll(),
        });

        Tags.of(mlNodeAsg).add('role', 'ml-node');
      }

      opensearchListener.addTargets('opensearchTarget', {
        port: 9200,
        targets: [clientNodeAsg],
      });

      if (this.dashboardsUrl !== 'undefined') {
        // @ts-ignore
        dashboardsListener.addTargets('dashboardsTarget', {
          port: 5601,
          targets: [clientNodeAsg],
        });
      }
    }
    new CfnOutput(this, 'loadbalancer-url', {
      value: nlb.loadBalancerDnsName,
    });

    if (this.enableMonitoring) {
      const monitoring = new InfraStackMonitoring(this, this.dashboardsUrl);
    }
  }

  private getCfnInitElement(scope: Stack, logGroup: LogGroup, nodeType?: string): InitElement[] {
    const configFileDir = join(__dirname, '../opensearch-config');
    let opensearchConfig: string;
    const procstatConfig: ProcstatMetricDefinition[] = [{
      pattern: '-Dopensearch',
      measurement: [
        'pid_count',
      ],
      metrics_collection_interval: 10,
    },
    ];
    if (this.dashboardsUrl !== 'undefined') {
      procstatConfig.push({
        pattern: 'opensearch-dashboards',
        measurement: [
          'pid_count',
        ],
        metrics_collection_interval: 15,
      });
    }

    const cfnInitConfig: InitElement[] = [
      InitPackage.yum('amazon-cloudwatch-agent'),
      InitCommand.shellCommand('arc=$(arch); if [ "$arc" == "aarch64" ]; then dist="arm64"; else dist="amd64"; fi; '
          + 'sudo wget -nv https://github.com/mikefarah/yq/releases/download/v4.40.5/yq_linux_$dist '
      + '-O /usr/bin/yq && sudo chmod 755 /usr/bin/yq'),
      CloudwatchAgent.asInitFile('/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',
        {
          agent: {
            metrics_collection_interval: 60,
            logfile: '/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log',
            omit_hostname: true,
            debug: false,
          },
          metrics: {
            append_dimensions: {
              // eslint-disable-next-line no-template-curly-in-string
              InstanceId: '${aws:InstanceId}',
            },
            aggregation_dimensions: [[]], // Create rollups without instance id
            namespace: `${scope.stackName}/InfraStack`,
            metrics_collected: {
              procstat: procstatConfig,
              cpu: {
                measurement: [
                  // eslint-disable-next-line max-len
                  'usage_active', 'usage_guest', 'usage_guest_nice', 'usage_idle', 'usage_iowait', 'usage_irq', 'usage_nice', 'usage_softirq', 'usage_steal', 'usage_system', 'usage_user', 'time_active', 'time_iowait', 'time_system', 'time_user',
                ],
              },
              disk: {
                measurement: [
                  { name: 'free', unit: Unit.PERCENT },
                  { name: 'total', unit: Unit.PERCENT },
                  { name: 'used', unit: Unit.PERCENT },
                  { name: 'used_percent', unit: Unit.PERCENT },
                  { name: 'inodes_free', unit: Unit.PERCENT },
                  { name: 'inodes_used', unit: Unit.PERCENT },
                  { name: 'inodes_total', unit: Unit.PERCENT },
                ],
              },
              diskio: {
                measurement: [
                  'reads', 'writes', 'read_bytes', 'write_bytes', 'read_time', 'write_time', 'io_time',
                ],
              },
              mem: {
                measurement: [
                  { name: 'active', unit: Unit.PERCENT },
                  { name: 'available', unit: Unit.PERCENT },
                  { name: 'available_percent', unit: Unit.PERCENT },
                  { name: 'buffered', unit: Unit.PERCENT },
                  { name: 'cached', unit: Unit.PERCENT },
                  { name: 'free', unit: Unit.PERCENT },
                  { name: 'inactive', unit: Unit.PERCENT },
                  { name: 'total', unit: Unit.PERCENT },
                  { name: 'used', unit: Unit.PERCENT },
                  { name: 'used_percent', unit: Unit.PERCENT },
                ],
              },
              net: {
                measurement: [
                  'bytes_sent', 'bytes_recv', 'drop_in', 'drop_out', 'err_in', 'err_out', 'packets_sent', 'packets_recv',
                ],
              },
            },
          },
          logs: {
            logs_collected: {
              files: {
                collect_list: [
                  {
                    file_path: `/home/ec2-user/opensearch/logs/${scope.stackName}-${scope.account}-${scope.region}.log`,
                    log_group_name: `${logGroup.logGroupName.toString()}`,
                    // eslint-disable-next-line no-template-curly-in-string
                    log_stream_name: '{instance_id}',
                    auto_removal: true,
                  },
                ],
              },
            },
            force_flush_interval: 5,
          },
        }),
      InitCommand.shellCommand('set -ex;/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a stop'),
      // eslint-disable-next-line max-len
      InitCommand.shellCommand('set -ex;/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'),
      InitCommand.shellCommand('set -ex; sudo echo "vm.max_map_count=262144" >> /etc/sysctl.conf;sudo sysctl -p'),
      InitCommand.shellCommand(`set -ex;mkdir opensearch; curl -L ${this.distributionUrl} -o opensearch.tar.gz;`
        + 'tar zxf opensearch.tar.gz -C opensearch --strip-components=1; chown -R ec2-user:ec2-user opensearch;', {
        cwd: '/home/ec2-user',
        ignoreErrors: false,
      }),
      InitCommand.shellCommand('sleep 15'),
    ];

    // Add opensearch.yml config
    if (this.singleNodeCluster) {
      const fileContent: any = load(readFileSync(`${configFileDir}/single-node-base-config.yml`, 'utf-8'));

      fileContent['cluster.name'] = `${scope.stackName}-${scope.account}-${scope.region}`;

      opensearchConfig = dump(fileContent).toString();
      cfnInitConfig.push(InitCommand.shellCommand(`set -ex;cd opensearch; echo "${opensearchConfig}" > config/opensearch.yml`,
        {
          cwd: '/home/ec2-user',
        }));
    } else {
      const baseConfig: any = load(readFileSync(`${configFileDir}/multi-node-base-config.yml`, 'utf-8'));

      baseConfig['cluster.name'] = `${scope.stackName}-${scope.account}-${scope.region}`;

      // use discovery-ec2 to find manager nodes by querying IMDS
      baseConfig['discovery.ec2.tag.Name'] = `${scope.stackName}/seedNodeAsg,${scope.stackName}/managerNodeAsg`;

      const commonConfig = dump(baseConfig).toString();
      cfnInitConfig.push(InitCommand.shellCommand(`set -ex;cd opensearch; echo "${commonConfig}" > config/opensearch.yml`,
        {
          cwd: '/home/ec2-user',
        }));

      if (nodeType != null) {
        const nodeTypeConfig = nodeConfig.get(nodeType);
        const nodeConfigData = dump(nodeTypeConfig).toString();
        cfnInitConfig.push(InitCommand.shellCommand(`set -ex;cd opensearch; echo "${nodeConfigData}" >> config/opensearch.yml`,
          {
            cwd: '/home/ec2-user',
          }));
      }

      if (this.distributionUrl.includes('artifacts.opensearch.org') && !this.minDistribution) {
        cfnInitConfig.push(InitCommand.shellCommand('set -ex;cd opensearch;sudo -u ec2-user bin/opensearch-plugin install discovery-ec2 --batch', {
          cwd: '/home/ec2-user',
          ignoreErrors: false,
        }));
      } else {
        cfnInitConfig.push(InitCommand.shellCommand('set -ex;cd opensearch;sudo -u ec2-user bin/opensearch-plugin install '
          + `https://ci.opensearch.org/ci/dbc/distribution-build-opensearch/${this.distVersion}/latest/linux/${this.cpuArch}`
          + `/tar/builds/opensearch/core-plugins/discovery-ec2-${this.distVersion}.zip --batch`, {
          cwd: '/home/ec2-user',
          ignoreErrors: false,
        }));
      }

      if (this.enableRemoteStore) {
        // eslint-disable-next-line max-len
        cfnInitConfig.push(InitCommand.shellCommand(`set -ex;cd opensearch; echo "node.attr.remote_store.segment.repository: ${scope.stackName}-repo" >> config/opensearch.yml`, {
          cwd: '/home/ec2-user',
          ignoreErrors: false,
        }));

        // eslint-disable-next-line max-len
        cfnInitConfig.push(InitCommand.shellCommand(`set -ex;cd opensearch; echo "node.attr.remote_store.repository.${scope.stackName}-repo.type: s3" >> config/opensearch.yml`, {
          cwd: '/home/ec2-user',
          ignoreErrors: false,
        }));

        // eslint-disable-next-line max-len
        cfnInitConfig.push(InitCommand.shellCommand(`set -ex;cd opensearch; echo "node.attr.remote_store.repository.${scope.stackName}-repo.settings:\n  bucket : ${scope.stackName}\n  base_path: remote-store\n  region: ${scope.region}" >> config/opensearch.yml`, {
          cwd: '/home/ec2-user',
          ignoreErrors: false,
        }));

        // eslint-disable-next-line max-len
        cfnInitConfig.push(InitCommand.shellCommand(`set -ex;cd opensearch; echo "node.attr.remote_store.translog.repository: ${scope.stackName}-repo" >> config/opensearch.yml`, {
          cwd: '/home/ec2-user',
          ignoreErrors: false,
        }));

        // eslint-disable-next-line max-len
        cfnInitConfig.push(InitCommand.shellCommand(`set -ex;cd opensearch; echo "node.attr.remote_store.state.repository: ${scope.stackName}-repo" >> config/opensearch.yml`, {
          cwd: '/home/ec2-user',
          ignoreErrors: false,
        }));
      }
    }

    if (this.distributionUrl.includes('artifacts.opensearch.org') && !this.minDistribution) {
      cfnInitConfig.push(InitCommand.shellCommand('set -ex;cd opensearch;sudo -u ec2-user bin/opensearch-plugin install repository-s3 --batch', {
        cwd: '/home/ec2-user',
        ignoreErrors: false,
      }));
    } else {
      cfnInitConfig.push(InitCommand.shellCommand('set -ex;cd opensearch;sudo -u ec2-user bin/opensearch-plugin install '
          + `https://ci.opensearch.org/ci/dbc/distribution-build-opensearch/${this.distVersion}/latest/linux/${this.cpuArch}`
          + `/tar/builds/opensearch/core-plugins/repository-s3-${this.distVersion}.zip --batch`, {
        cwd: '/home/ec2-user',
        ignoreErrors: false,
      }));
    }

    // add config to disable security if required
    if (this.securityDisabled && !this.minDistribution) {
      // eslint-disable-next-line max-len
      cfnInitConfig.push(InitCommand.shellCommand('set -ex;cd opensearch; if [ -d "/home/ec2-user/opensearch/plugins/opensearch-security" ]; then echo "plugins.security.disabled: true" >> config/opensearch.yml; fi',
        {
          cwd: '/home/ec2-user',
          ignoreErrors: false,
        }));
    }

    // Check if there are any jvm properties being passed
    if (this.jvmSysProps.toString() !== 'undefined') {
      cfnInitConfig.push(InitCommand.shellCommand(`set -ex; cd opensearch; jvmSysPropsList=$(echo "${this.jvmSysProps.toString()}" | tr ',' '\\n');`
        + 'for sysProp in $jvmSysPropsList;do echo "-D$sysProp" >> config/jvm.options;done',
      {
        cwd: '/home/ec2-user',
        ignoreErrors: false,
      }));
    }

    // Check if JVM Heap Memory is set. Default is 1G in the jvm.options file
    if (this.use50PercentHeap) {
      cfnInitConfig.push(InitCommand.shellCommand(`set -ex; cd opensearch;
      totalMem=\`expr $(free -g | awk '/^Mem:/{print $2}') + 1\`;
      heapSizeInGb=\`expr $totalMem / 2\`;
      if [ $heapSizeInGb -lt 32 ];then minHeap="-Xms"$heapSizeInGb"g";maxHeap="-Xmx"$heapSizeInGb"g";else minHeap="-Xms32g";maxHeap="-Xmx32g";fi
      sed -i -e "s/^-Xms[0-9a-z]*$/$minHeap/g" config/jvm.options;
      sed -i -e "s/^-Xmx[0-9a-z]*$/$maxHeap/g" config/jvm.options;`, {
        cwd: '/home/ec2-user',
        ignoreErrors: false,
      }));
    }

    if (this.additionalConfig.toString() !== 'undefined') {
      cfnInitConfig.push(InitCommand.shellCommand(`set -ex; cd opensearch/config; echo "${this.additionalConfig}">additionalConfig.yml; `
      + 'yq eval-all -i \'. as $item ireduce ({}; . * $item)\' opensearch.yml additionalConfig.yml -P',
      {
        cwd: '/home/ec2-user',
        ignoreErrors: false,
      }));
    }

    if (this.customConfigFiles !== 'undefined') {
      try {
        const jsonObj = JSON.parse(this.customConfigFiles);
        Object.keys(jsonObj).forEach((localFileName) => {
          const getConfig = load(readFileSync(localFileName, 'utf-8'));
          const remoteConfigLocation = jsonObj[localFileName];
          cfnInitConfig.push(InitCommand.shellCommand(`set -ex; echo "${dump(getConfig)}" > ${remoteConfigLocation}`,
            {
              cwd: '/home/ec2-user',
              ignoreErrors: false,
            }));
        });
      } catch (e) {
        throw new Error(`Encountered following error while parsing customConfigFiles json parameter: ${e}`);
      }
    }

    // Starting OpenSearch based on whether the distribution type is min or bundle
    if (this.minDistribution) { // using (stackProps.minDistribution) condition is not working when false value is being sent
      cfnInitConfig.push(InitCommand.shellCommand('set -ex;cd opensearch; sudo -u ec2-user nohup ./bin/opensearch >> install.log 2>&1 &',
        {
          cwd: '/home/ec2-user',
          ignoreErrors: false,
        }));
    } else {
      cfnInitConfig.push(InitCommand.shellCommand('set -ex;cd opensearch; '
      + `sudo -u ec2-user nohup env OPENSEARCH_INITIAL_ADMIN_PASSWORD=${this.adminPassword} ./opensearch-tar-install.sh >> install.log 2>&1 &`,
      {
        cwd: '/home/ec2-user',
        ignoreErrors: false,
      }));
    }

    // If OpenSearch-Dashboards URL is present
    if (this.dashboardsUrl !== 'undefined') {
      cfnInitConfig.push(InitCommand.shellCommand(`set -ex;mkdir opensearch-dashboards; curl -L ${this.dashboardsUrl} -o opensearch-dashboards.tar.gz;`
        + 'tar zxf opensearch-dashboards.tar.gz -C opensearch-dashboards --strip-components=1; chown -R ec2-user:ec2-user opensearch-dashboards;', {
        cwd: '/home/ec2-user',
        ignoreErrors: false,
      }));

      cfnInitConfig.push(InitCommand.shellCommand('set -ex;cd opensearch-dashboards;echo "server.host: 0.0.0.0" >> config/opensearch_dashboards.yml',
        {
          cwd: '/home/ec2-user',
          ignoreErrors: false,
        }));

      if (this.securityDisabled && !this.minDistribution) {
        cfnInitConfig.push(InitCommand.shellCommand('set -ex;cd opensearch-dashboards;'
          + './bin/opensearch-dashboards-plugin remove securityDashboards --allow-root;'
          + 'sed -i /^opensearch_security/d config/opensearch_dashboards.yml;'
          + 'sed -i \'s/https/http/\' config/opensearch_dashboards.yml',
        {
          cwd: '/home/ec2-user',
          ignoreErrors: false,
        }));
      }

      if (this.additionalOsdConfig.toString() !== 'undefined') {
        cfnInitConfig.push(InitCommand.shellCommand(`set -ex;cd opensearch-dashboards/config; echo "${this.additionalOsdConfig}">additionalOsdConfig.yml; `
        + 'yq eval-all -i \'. as $item ireduce ({}; . * $item)\' opensearch_dashboards.yml additionalOsdConfig.yml -P',
        {
          cwd: '/home/ec2-user',
          ignoreErrors: false,
        }));
      }

      // Starting OpenSearch-Dashboards
      cfnInitConfig.push(InitCommand.shellCommand('set -ex;cd opensearch-dashboards;'
        + 'sudo -u ec2-user nohup ./bin/opensearch-dashboards > dashboard_install.log 2>&1 &', {
        cwd: '/home/ec2-user',
        ignoreErrors: false,
      }));
    }

    return cfnInitConfig;
  }
}
