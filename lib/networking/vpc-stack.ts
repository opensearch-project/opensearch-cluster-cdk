/* Copyright OpenSearch Contributors
SPDX-License-Identifier: Apache-2.0

The OpenSearch Contributors require contributions made to
this file be licensed under the Apache-2.0 license or a
compatible open source license. */

import { Construct } from 'constructs';
import {
  IPeer,
  ISecurityGroup,
  IVpc,
  Peer, Port, SecurityGroup, SubnetType, Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { App, Stack, StackProps } from 'aws-cdk-lib';

export interface vpcProps extends StackProps{
    cidrBlock: string,
    maxAzs: number,
    vpcId: string,
    securityGroupId: string,
    serverAccessType: string,
    restrictServerAccessTo: string,
}

export class NetworkStack extends Stack {
  public readonly vpc: IVpc;

  public readonly osSecurityGroup: ISecurityGroup;

  constructor(scope: Construct, id: string, props: vpcProps) {
    let serverAccess: IPeer;
    super(scope, id, props);
    if (props.vpcId === undefined) {
      console.log('No VPC Provided, creating new');
      this.vpc = new Vpc(this, 'opensearchClusterVpc', {
        cidr: (props.cidrBlock !== undefined) ? props.cidrBlock : '10.0.0.0/16',
        maxAzs: props.maxAzs,
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
        vpcId: props.vpcId,
      });
    }

    if (typeof props.restrictServerAccessTo === 'undefined' || typeof props.serverAccessType === 'undefined') {
      throw new Error('serverAccessType and restrictServerAccessTo parameters are required - eg: serverAccessType=ipv4 restrictServerAccessTo=10.10.10.10/32');
    } else {
      serverAccess = NetworkStack.getServerAccess(props.restrictServerAccessTo, props.serverAccessType);
    }

    if (props.securityGroupId === undefined) {
      this.osSecurityGroup = new SecurityGroup(this, 'osSecurityGroup', {
        vpc: this.vpc,
        allowAllOutbound: true,
      });
    } else {
      this.osSecurityGroup = SecurityGroup.fromSecurityGroupId(this, 'osSecurityGroup', props.securityGroupId);
    }

    /* The security group allows all ip access by default to all the ports.
    Please update below if you want to restrict access to certain ips and ports */
    this.osSecurityGroup.addIngressRule(serverAccess, Port.allTcp());
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
      throw new Error('serverAccessType should be one of the below values: ipv4, ipv6, prefixList or  securityGroupId');
    }
  }
}
