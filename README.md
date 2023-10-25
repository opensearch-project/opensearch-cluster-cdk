# CDK for deploying single-node and multi-node OpenSearch cluster with OpenSearch Dashboards

- [Getting Started](#getting-started)
- [Deployment](#deployment)
  - [Required context parameters](#required-context-parameters)
  - [Interacting with OpenSearch cluster](#interacting-with-opensearch-cluster)
  - [Restricting Server Access](#restricting-server-access)
  - [Enable Remote Store Feature](#enable-remote-store-feature)
- [Check Logs](#check-logs)
- [Access EC2 Instances](#access-ec2-instances)
- [Port Mapping](#port-mapping)
- [Teardown](#teardown)
- [Contributing](#contributing)
- [Getting Help](#getting-help)
- [Code of Conduct](#code-of-conduct)
- [Security](#security)
- [License](#license)

This project enables user to deploy either a single-node or a multi-node OpenSearch cluster.
There are two stacks that get deployed:
1. OpenSearch-Network-Stack: Use this stack to either use an existing Vpc or create a new Vpc. This stack also creates a new security group to manage access.
2. OpenSearch-Infra-Stack: Sets up EC2 Auto-scaling group (ASG) (installs opensearch and opensearch-dashboards using userdata), cloudwatch logging, load balancer. Check your cluster log in the log group created from your stack in the cloudwatch.

## Getting Started

- Requires [NPM](https://docs.npmjs.com/cli/v7/configuring-npm/install) to be installed
- Install project dependencies using `npm install` from this project directory
- Configure [aws credentials](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html#getting_started_prerequisites)

## Deployment

### Required context parameters

In order to deploy both the stacks the user needs to provide a set of required and optional parameters listed below:

| Name                   | Requirement | Type    | Description                                                                                                                                                                                                                                                                                      |
|------------------------|:------------|:--------|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| distVersion            | Required    | string  | The OpenSearch distribution version (released/un-released) the user wants to deploy                                                                                                                                                                                                              |
| securityDisabled       | Required    | boolean | Enable or disable security plugin                                                                                                                                                                                                                                                                |
| minDistribution        | Required    | boolean | Is it the minimal OpenSearch distribution with no security and plugins                                                                                                                                                                                                                           |
| distributionUrl        | Required    | string  | OpenSearch tar distribution url                                                                                                                                                                                                                                                                  |
| cpuArch                | Required    | string  | CPU platform for EC2, could be either `x64` or `arm64`                                                                                                                                                                                                                                           |
| singleNodeCluster      | Required    | boolean | Set `true` for single-node cluster else `false` for multi-node                                                                                                                                                                                                                                   |
| serverAccessType       | Required    | string  | Restrict server access based on ip address (ipv4/ipv6), prefix list and/or security group. See [Restricting Server Access](#restricting-server-access) for more details.                                                                                                                         |
| restrictServerAccessTo | Required    | string  | The value for `serverAccessType`, e.g., 10.10.10.10/32, pl-12345, sg-12345. See [Restricting Server Access](#restricting-server-access) for more details.                                                                                                                                        |
| dashboardsUrl          | Optional    | string  | OpenSearch Dashboards tar distribution url                                                                                                                                                                                                                                                       |
| vpcId                  | Optional    | string  | Re-use existing vpc, provide vpc id                                                                                                                                                                                                                                                              |
| securityGroupId        | Optional    | boolean | Re-use existing security group, provide security group id                                                                                                                                                                                                                                        |
| cidr                   | Optional    | string  | User provided CIDR block for new Vpc. Defaults to `10.0.0.0/16`                                                                                                                                                                                                                                  |
| managerNodeCount       | Optional    | integer | Number of cluster manager nodes. Defaults to 3                                                                                                                                                                                                                                                   |
| dataNodeCount          | Optional    | integer | Number of data nodes. Defaults to 2                                                                                                                                                                                                                                                              |
| clientNodeCount        | Optional    | integer | Number of dedicated client nodes. Defaults to 0                                                                                                                                                                                                                                                  |
| ingestNodeCount        | Optional    | integer | Number of dedicated ingest nodes. Defaults to 0                                                                                                                                                                                                                                                  |
| mlNodeCount            | Optional    | integer | Number of dedicated machine learning nodes. Defaults to 0                                                                                                                                                                                                                                        |
| dataInstanceType       | Optional    | string  | EC2 instance type for data node. Defaults to r5.xlarge. See options in `lib/opensearch-config/node-config.ts` for available options. E.g., `-c dataInstanceType=m5.xlarge`                                                                                                                       |
| mlInstanceType         | Optional    | string  | EC2 instance type for ml node. Defaults to r5.xlarge. See options in `lib/opensearch-config/node-config.ts` for available options. E.g., `-c mlInstanceType=m5.xlarge`                                                                                                                           |
| jvmSysProps            | Optional    | string  | A comma-separated list of key=value pairs that will be added to `jvm.options` as JVM system properties.                                                                                                                                                                                          |
| additionalConfig       | Optional    | string  | Additional opensearch.yml config parameters passed as JSON. e.g., `--context additionalConfig='{"plugins.security.nodes_dn": ["CN=*.example.com, OU=SSL, O=Test, L=Test, C=DE", "CN=node.other.com, OU=SSL, O=Test, L=Test, C=DE"], "plugins.security.nodes_dn_dynamic_config_enabled": false}'` |
| suffix                 | Optional    | string  | An optional string identifier to be concatenated with infra stack name.                                                                                                                                                                                                                          |
| region                 | Optional    | string  | User provided aws region                                                                                                                                                                                                                                                                         |
| account                | Optional    | string  | User provided aws account                                                                                                                                                                                                                                                                        |
| dataNodeStorage        | Optional    | string  | User provided ebs block storage size. Defaults to 100Gb                                                                                                                                                                                                                                          |
| mlNodeStorage          | Optional    | string  | User provided ebs block storage size. Defaults to 100Gb                                                                                                                                                                                                                                          |
| use50PercentHeap       | Optional    | boolean | Boolean flag to use 50% of physical memory as heap. Defaults to 1GB.  e.g., `--context use50PercentHeap=true`                                                                                                                                                                                    |
| isInternal             | Optional    | boolean | Boolean flag to make network load balancer internal. Defaults to internet-facing  e.g., `--context isInternal=true`                                                                                                                                                                              |
| enableRemoteStore      | Optional    | boolean | Boolean flag to enable Remote Store feature  e.g., `--context enableRemoteStore=true`. See [Enable Remote Store Feature](#enable-remote-store-feature) for more details. Defaults to false                                                                                                       |
| storageVolumeType      | Optional    | string  | EBS volume type for all the nodes (data, ml, cluster manager). Defaults to gp2. See `lib/opensearch-config/node-config.ts` for available options. E.g., `-c storageVolumeType=gp3`. For SSD based instance (i.e. i3 family), it is used for root volume configuration.                           |
| customRoleArn          | Optional    | string  | User provided IAM role arn to be used as ec2 instance profile. `-c customRoleArn=arn:aws:iam::<AWS_ACCOUNT_ID>:role/<ROLE_NAME>`                                                                                                                                                                 |

* Before starting this step, ensure that your AWS CLI is correctly configured with access credentials.
* Also ensure that you're running these commands in the current directory

* Next, install the required dependencies:

```
npm install
```

* First, run CDK bootstrap.
* You need to provide all the required context parameters in the command

```
cdk bootstrap aws://<aws-account-number>/<aws-region> --context securityDisabled=false \
--context minDistribution=false --context distributionUrl='https://artifacts.opensearch.org/releases/bundle/opensearch/2.3.0/opensearch-2.3.0-linux-x64.tar.gz' \
--context cpuArch='x64' --context singleNodeCluster=false --context dataNodeCount=3 \
--context dashboardsUrl='https://artifacts.opensearch.org/releases/bundle/opensearch-dashboards/2.3.0/opensearch-dashboards-2.3.0-linux-x64.tar.gz' \
--context distVersion=2.3.0 --context serverAccessType=ipv4 --context restrictServerAccessTo=10.10.10.10/32
```
* Now you are ready to synthesize the CloudFormation templates:

```
cdk synth "* " --context securityDisabled=false \
--context minDistribution=false --context distributionUrl='https://artifacts.opensearch.org/releases/bundle/opensearch/2.3.0/opensearch-2.3.0-linux-x64.tar.gz' \
--context cpuArch='x64' --context singleNodeCluster=false --context dataNodeCount=3 \
--context dashboardsUrl='https://artifacts.opensearch.org/releases/bundle/opensearch-dashboards/2.3.0/opensearch-dashboards-2.3.0-linux-x64.tar.gz' \
--context distVersion=2.3.0 --context serverAccessType=ipv4 --context restrictServerAccessTo=10.10.10.10/32
```

#### Sample command to set up multi-node cluster with security disabled on x64 AL2 machine

Please note that as of now we only support instances backed by Amazon Linux-2 amis.

```
cdk deploy "*" --context securityDisabled=false \
--context minDistribution=false --context distributionUrl='https://artifacts.opensearch.org/releases/bundle/opensearch/2.3.0/opensearch-2.3.0-linux-x64.tar.gz' \
--context cpuArch='x64' --context singleNodeCluster=false --context dataNodeCount=3 \
--context dashboardsUrl='https://artifacts.opensearch.org/releases/bundle/opensearch-dashboards/2.3.0/opensearch-dashboards-2.3.0-linux-x64.tar.gz' \
--context distVersion=2.3.0 --context serverAccessType=ipv4 --context restrictServerAccessTo=10.10.10.10/32
```

### Interacting with OpenSearch cluster

After CDK Stack deployment the user will be returned a load-balancer url which they can use to interact with the cluster.

#### Sample commands
`curl -X GET "http://<load-balancer-url>/_cluster/health?pretty"` for OpenSearch

To interact with dashboards use port `8443`. Type `http://<load-balancer-url>:8443` in your browser.

For security enabled cluster run `curl -X GET https://<load-balancer-url> -u 'admin:admin' --insecure`
The security enabled dashboard is accessible using `http` on port `8443`

### Restricting Server Access
#### Please note the load-balancer url is internet facing and can be accessed by anyone.
To restrict access please refer [Client IP Preservation](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-target-groups.html#client-ip-preservation) to restrict access on internet-facing network load balancer.
You need to restrict access to your OpenSearch cluster endpoint (load balancer).

Below values are allowed:
| serverAccessType| restrictServerAccessTo|
|-----------------|:---------|
| ipv4            | all (0.0.0.0/0) or any ipv4 CIDR (eg: 10.10.10.10/32)  |
| ipv6            | all (::/0) or any ipv6 CIDR (eg: 2001:0db8:85a3:0000:0000:8a2e:0370:7334)  |
| prefixList      | Prefix List id (eg: ab-12345)  |
| securityGroupId | A security group ID (eg: sg-123456789)  |

### Enable Remote Store Feature

`Remote Store` feature provides an option to store indexed data in a remote durable data store. To enable this feature the user needs to register a snapshot repository (S3 or File System) which is used to store the index data.
Apart from passing `enableRemoteStore` flag as `true` the user needs to be provide additional settings to `opensearch.yml`, the settings are:
```
1. opensearch.experimental.feature.remote_store.enabled: 'true'
2. cluster.remote_store.enabled: 'true'
3. opensearch.experimental.feature.segment_replication_experimental.enabled: 'true'
4. cluster.indices.replication.strategy: SEGMENT
```
The above-mentioned settings need to be passed using `additionalConfig` parameter.
Please note the `experimental` settings are only applicable till the feature is under development and will be removed when the feature becomes GA.

## Check logs

The opensearch logs are available in cloudwatch logs log-group `opensearchLogGroup/opensearch.log` in the same region your stack is deployed.
Each EC2 instance will create its own log-stream and the log-stream will be named after each instance-id.

## Access EC2 Instances

All the ec2 instances are hosted in private subnet and can only be accessed using [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)

## Port Mapping

The ports to access the cluster are dependent on the `security` parameter value
* If `security` is `disable` (HTTP),
    * OpenSearch 9200 is mapped to port 80 on the LB
* If `security` is `enable` (HTTPS),
    * OpenSearch 9200 is mapped to port 443 on the LB
* OpenSearch-Dasboards 5601 is always mapped to port 8443 on the LB (HTTP)

## Teardown

To delete a particular stack use the command:

```
cdk destroy <stackName> <pass all the context parameters>
```

To delete all the created stacks together use the command:

```
cdk destroy --all <pass all the context parameters>
```

## Contributing

See [developer guide](DEVELOPER_GUIDE.md) and [how to contribute to this project](CONTRIBUTING.md).

## Getting Help

If you find a bug, or have a feature request, please don't hesitate to open an issue in this repository.

For more information, see [project website](https://opensearch.org/) and [documentation](https://docs-beta.opensearch.org/). If you need help and are unsure where to open an issue, try [forums](https://discuss.opendistrocommunity.dev/).

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](CODE_OF_CONDUCT.md). For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq), or contact [opensource-codeofconduct@amazon.com](mailto:opensource-codeofconduct@amazon.com) with any additional questions or comments.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
