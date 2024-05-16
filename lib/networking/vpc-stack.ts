/* Copyright OpenSearch Contributors
SPDX-License-Identifier: Apache-2.0

The OpenSearch Contributors require contributions made to
this file be licensed under the Apache-2.0 license or a
compatible open source license. */

import { Stack, StackProps } from 'aws-cdk-lib';
import {
  IpAddresses,
  IPeer,
  ISecurityGroup,
  IVpc,
  Peer, Port, SecurityGroup, SubnetType, Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface VpcProps extends StackProps{
    /** CIDR Block for VPC */
    cidr?: string,
    /** VPC ID of existing VPC */
    vpcId?: string,
    /** Security Group to be used for all sources */
    securityGroupId?: string,
    /** The access type to restrict server. Choose from ipv4, ipv6, prefixList or securityGroupId */
    serverAccessType?: string,
    /** Restrict server access to */
    restrictServerAccessTo?: string,
}

export class NetworkStack extends Stack {
  public readonly vpc: IVpc;

  public readonly osSecurityGroup: ISecurityGroup;

  constructor(scope: Construct, id: string, props: VpcProps) {
    super(scope, id, props);

    let serverAccess: IPeer;
    // Properties and context variables check
    let cidrRange = `${props?.cidr ?? scope.node.tryGetContext('cidr')}`;
    if (cidrRange === 'undefined') {
      cidrRange = '10.0.0.0/16';
    }
    const vpcId = `${props?.vpcId ?? scope.node.tryGetContext('vpcId')}`;
    const serverAccessType = `${props?.serverAccessType ?? scope.node.tryGetContext('serverAccessType')}`;
    const restrictServerAccessTo = `${props?.restrictServerAccessTo ?? scope.node.tryGetContext('restrictServerAccessTo')}`;
    const secGroupId = `${props?.securityGroupId ?? scope.node.tryGetContext('securityGroupId')}`;

    if (typeof restrictServerAccessTo === 'undefined' || typeof serverAccessType === 'undefined') {
      throw new Error('serverAccessType and restrictServerAccessTo parameters are required - eg: serverAccessType=ipv4 restrictServerAccessTo=10.10.10.10/32');
    } else {
      serverAccess = NetworkStack.getServerAccess(restrictServerAccessTo, serverAccessType);
    }

    // VPC specs
    if (vpcId === 'undefined') {
      console.log('No VPC-Id Provided, a new VPC will be created');
      this.vpc = new Vpc(this, 'opensearchClusterVpc', {
        ipAddresses: IpAddresses.cidr(cidrRange),
        maxAzs: 3,
        subnetConfiguration: [
          {
            name: 'public-subnet',
            subnetType: SubnetType.PUBLIC,
            cidrMask: 24,
          },
          {
            name: 'private-subnet',
            subnetType: SubnetType.PRIVATE_WITH_EGRESS,
            cidrMask: 24,
          },
        ],
      });
    } else {
      console.log('VPC provided, using existing');
      this.vpc = Vpc.fromLookup(this, 'opensearchClusterVpc', {
        vpcId,
      });
    }

    // Security Group specs
    if (secGroupId === 'undefined') {
      this.osSecurityGroup = new SecurityGroup(this, 'osSecurityGroup', {
        vpc: this.vpc,
        allowAllOutbound: true,
      });
    } else {
      this.osSecurityGroup = SecurityGroup.fromSecurityGroupId(this, 'osSecurityGroup', secGroupId);
    }

    /* The security group allows all ip access by default to all the ports.
    Please update below if you want to restrict access to certain ips and ports */
    this.osSecurityGroup.addIngressRule(serverAccess, Port.tcp(80));
    this.osSecurityGroup.addIngressRule(serverAccess, Port.tcp(443));
    this.osSecurityGroup.addIngressRule(serverAccess, Port.tcp(9200));
    this.osSecurityGroup.addIngressRule(serverAccess, Port.tcp(5601));
    this.osSecurityGroup.addIngressRule(serverAccess, Port.tcp(8443));
    this.osSecurityGroup.addIngressRule(this.osSecurityGroup, Port.allTraffic());
  }

  private static getServerAccess(restrictServerAccessTo: string, serverAccessType: string): IPeer {
    switch (serverAccessType) {
    case 'ipv4':
      return restrictServerAccessTo === 'all' ? Peer.anyIpv4() : Peer.ipv4(restrictServerAccessTo);
    case 'ipv6':
      return restrictServerAccessTo === 'all' ? Peer.anyIpv6() : Peer.ipv6(restrictServerAccessTo);
    case 'prefixList':
      return Peer.prefixList(restrictServerAccessTo);
    case 'securityGroupId':
      return Peer.securityGroupId(restrictServerAccessTo);
    default:
      throw new Error('serverAccessType should be one of the below values: ipv4, ipv6, prefixList or securityGroupId');
    }
  }
}
