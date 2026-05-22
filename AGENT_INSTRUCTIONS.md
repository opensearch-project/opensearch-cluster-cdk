# Agent Instructions: Deploy a Single-Node OpenSearch Cluster

You are an agent that helps deploy OpenSearch clusters on AWS using the `opensearch-cluster-cdk` project. This CDK project provisions EC2 instances running OpenSearch via CloudFormation. Follow these instructions precisely.

---

## Overview

This project deploys two CloudFormation stacks:

1. **`opensearch-network-stack`** — Creates a VPC (or reuses an existing one) and a Security Group named `osSecurityGroup` that controls inbound access to the cluster.
2. **`opensearch-infra-stack-<suffix>`** — Creates an EC2 instance (inside an Auto Scaling Group), a Network Load Balancer (NLB), a CloudWatch log group for OpenSearch logs, and an IAM instance profile role.

The EC2 instance runs **Amazon Linux 2023 (AL2023)**. OpenSearch is installed at `/home/ec2-user/opensearch/` from a tar.gz distribution. The instance is placed in a **private subnet** — there is no SSH access. Access is only possible via **AWS Systems Manager (SSM) Session Manager**.

The cluster is fronted by a Network Load Balancer. When using a prefix list for access control, the cluster is only reachable over **VPN** or **Cloud Desktop**.

---

## Prerequisites Check

Before deploying, verify all of the following:

1. **Working directory**: You must be inside the `opensearch-cluster-cdk` project root (the directory containing `bin/app.ts`, `lib/`, `cdk.json`, `package.json`).

2. **Node.js**: Run `node --version`. Must be v20+. If not installed, the user needs to install it from https://nodejs.org/.

3. **AWS CDK CLI**: Run `cdk --version`. If not installed, run:
   ```bash
   npm install -g aws-cdk
   ```

4. **Project dependencies**: Check if `node_modules/` directory exists. If not, run:
   ```bash
   npm install
   ```

5. **AWS credentials**: Run `aws sts get-caller-identity`. If it fails or returns an error, ask the user to authenticate:
   ```bash
   ada credentials update --account <ACCOUNT_ID> --provider isengard --role Admin --once
   ```
   This writes temporary credentials to `~/.aws/credentials`. Credentials expire after ~1 hour.

---

## Context Parameters — Full Reference

All configuration is passed via `-c key=value` flags on the `cdk deploy` command. Below is every parameter, what it does, when it's required, and what values are valid.

### Required Parameters

These MUST be provided for every deployment:

| Parameter | Type | Description |
|-----------|------|-------------|
| `distVersion` | string | The OpenSearch version number being deployed. Examples: `2.19.0`, `3.7.0`. This is used for naming, plugin installation URLs, and version-specific behavior (e.g., admin password requirement for >= 2.12.0). |
| `distributionUrl` | string | Full URL to the OpenSearch `.tar.gz` distribution bundle. Can be a public release URL like `https://artifacts.opensearch.org/releases/bundle/opensearch/3.7.0/opensearch-3.7.0-linux-x64.tar.gz` or a CI build URL like `https://ci.opensearch.org/ci/dbc/feature-build-opensearch/feature-datafusion/latest/linux/x64/tar/dist/opensearch/opensearch-3.7.0-linux-x64.tar.gz`. Can also be an S3 URI like `s3://bucket/path/opensearch.tar.gz` (the EC2 instance role must have S3 read access). |
| `securityDisabled` | boolean | `true` = security plugin is disabled (HTTP access, no auth). `false` = security plugin is enabled (HTTPS, requires authentication). When `false` and version >= 2.12.0, you MUST also provide `adminPassword`. |
| `minDistribution` | boolean | `true` = minimal distribution with no plugins at all. `false` = full bundle distribution with all plugins included. Almost always use `false` unless testing a bare-bones OpenSearch. |
| `cpuArch` | string | CPU architecture of the EC2 instance. Valid values: `x64` or `arm64`. Must match the tar.gz distribution URL (a linux-x64 tar needs `cpuArch=x64`). |
| `singleNodeCluster` | boolean | `true` = deploy a single EC2 instance running all OpenSearch roles. `false` = deploy a multi-node cluster with separate manager, data, and optionally client/ingest/ml nodes. For this agent, always use `true`. |
| `serverAccessType` | string | How to restrict inbound access to the load balancer. Valid values: `prefixList`, `ipv4`, `ipv6`, `securityGroupId`. **Use `prefixList`** to keep the cluster off the public internet (recommended). |
| `restrictServerAccessTo` | string | The value corresponding to `serverAccessType`. For `prefixList`: a prefix list ID like `pl-60b85b09`. For `ipv4`: a CIDR like `10.0.0.0/8` or `0.0.0.0/0` (all). For `ipv6`: an IPv6 CIDR. For `securityGroupId`: a security group ID like `sg-12345`. |

### Optional Parameters

These have defaults and can be omitted, but are commonly used:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `suffix` | string | none | **Highly recommended.** Appended to the infra stack name to make it unique. Without this, the stack is named `opensearch-infra-stack` which will conflict if someone else has deployed one in the same account. Example: `suffix=my-test` creates `opensearch-infra-stack-my-test`. |
| `region` | string | `CDK_DEFAULT_REGION` env var | AWS region to deploy in. Examples: `us-east-1`, `us-west-2`, `eu-west-1`. |
| `account` | string | `CDK_DEFAULT_ACCOUNT` env var | AWS account ID (12-digit number). Example: `724293578735`. |
| `vpcId` | string | creates new VPC | If provided, reuses an existing VPC instead of creating a new one. Example: `vpc-0c413a9df7ca84d06`. The VPC must exist in the target region and have both public and private subnets. |
| `dataInstanceType` | string | `r5.xlarge` (x64) or `r6g.xlarge` (arm64) | EC2 instance type for the data/single node. **Valid x64 types**: `m5.xlarge`, `m5.2xlarge`, `c5.large`, `c5.xlarge`, `c5.2xlarge`, `c5.4xlarge`, `c5d.xlarge`, `c5d.2xlarge`, `r5.large`, `r5.xlarge`, `r5.2xlarge`, `r5.4xlarge`, `r5.8xlarge`, `r5d.xlarge`, `r5d.2xlarge`, `r5d.4xlarge`, `r5d.8xlarge`, `g5.large`, `g5.xlarge`, `i3.large`, `i3.xlarge`, `i3.2xlarge`, `i3.4xlarge`, `i3.8xlarge`, `inf1.xlarge`, `inf1.2xlarge`, `t3.medium`, `c6a.xlarge`, `c6a.2xlarge`, `c6a.4xlarge`, `r7i.xlarge`, `r7i.2xlarge`, `r7i.4xlarge`, `r7i.8xlarge`. **Valid arm64 types**: `m6g.xlarge`, `m6g.2xlarge`, `c6g.large`, `c6g.xlarge`, `c6g.2xlarge`, `c6g.4xlarge`, `c6gd.xlarge`, `c6gd.2xlarge`, `c6gd.4xlarge`, `c6gd.8xlarge`, `r6g.large`, `r6g.xlarge`, `r6g.2xlarge`, `r6g.4xlarge`, `r6g.8xlarge`, `r6gd.xlarge`, `r6gd.2xlarge`, `r6gd.4xlarge`, `r6gd.8xlarge`, `r7gd.xlarge`, `r7gd.2xlarge`, `r7gd.4xlarge`, `r7gd.8xlarge`, `r8g.xlarge`, `r8g.2xlarge`, `r8g.4xlarge`, `r8g.8xlarge`, `r8gd.xlarge`, `r8gd.2xlarge`, `r8gd.4xlarge`, `r8gd.8xlarge`, `g5g.large`, `g5g.xlarge`. |
| `dataNodeStorage` | number | `100` | EBS volume size in GB attached to the data node. Increase for large datasets. Example: `600`. |
| `storageVolumeType` | string | `gp2` | EBS volume type. Valid values: `gp2`, `gp3`, `io1`, `io2`. For SSD-backed instances (i3 family), this configures the root volume. |
| `useInstanceBasedStorage` | boolean | `false` | If `true`, mounts the NVMe SSD instance storage (available on `i3`, `c5d`, `r5d`, `c6gd`, `r6gd`, `r7gd`, `r8gd` families) and uses it for OpenSearch data instead of EBS. The instance type must support NVMe storage. |
| `heapSizeInGb` | number | ~50% of system memory (capped at 32GB) | Explicit JVM heap size in GB. If omitted, the startup script calculates 50% of available RAM (max 32GB). Example: `heapSizeInGb=16` sets `-Xms16g -Xmx16g`. |
| `customRoleArn` | string | creates new role | ARN of an existing IAM role to use as the EC2 instance profile. The role must have permissions for CloudWatch Logs, SSM, and optionally S3 (if using S3 distribution URLs or remote store). Example: `arn:aws:iam::724293578735:role/custom-benchmark-ec2-instance-role`. |
| `adminPassword` | string | none | **Required** when `securityDisabled=false` AND `distVersion` >= `2.12.0`. This sets the initial admin password for the security plugin. Must meet complexity requirements (uppercase, lowercase, number, special char, min 8 chars). Example: `MyStr0ngP@ss!`. |
| `dashboardsUrl` | string | none | URL to the OpenSearch Dashboards `.tar.gz` distribution. If provided, Dashboards is installed alongside OpenSearch and accessible on port 8443 via the LB. Example: `https://artifacts.opensearch.org/releases/bundle/opensearch-dashboards/3.7.0/opensearch-dashboards-3.7.0-linux-x64.tar.gz`. |
| `additionalConfig` | string (JSON) | none | Additional settings merged into `opensearch.yml`. Passed as a JSON string. Overwrites duplicate keys. Example: `-c additionalConfig='{"cluster.routing.allocation.disk.threshold_enabled": false}'`. |
| `additionalOsdConfig` | string (JSON) | none | Additional settings merged into `opensearch_dashboards.yml`. Same format as `additionalConfig`. |
| `jvmSysProps` | string | none | Comma-separated list of `key=value` pairs added to `jvm.options` as `-D` system properties. Example: `jvmSysProps=opensearch.experimental.feature.search_pipeline.enabled=true,other.prop=value`. |
| `isInternal` | boolean | `false` | If `true`, the Network Load Balancer is internal (only accessible within the VPC). If `false`, the NLB is internet-facing (but still restricted by the security group / prefix list). |
| `enableRemoteStore` | boolean | `false` | Enables the Remote Store feature which stores index data in S3. When `true`, an S3 bucket is created and the cluster is configured to use it. Requires additional `additionalConfig` settings for experimental versions. |
| `pluginUrl` | string | none | URL to a custom plugin `.zip` file to install on every node via `bin/opensearch-plugin install`. Example: a custom plugin hosted on S3 or a web server. |
| `customConfigFiles` | string (JSON) | none | JSON mapping of local file paths to remote file paths on the server. Used to overwrite or add config files. Keys are local paths, values must be prefixed with `opensearch` or `opensearch-dashboards`. Example: `-c customConfigFiles='{"local/config.yml": "opensearch/config/opensearch-security/config.yml"}'`. |
| `enableMonitoring` | boolean | `false` | Enables CloudWatch alarms and monitoring dashboards for the infra stack. |
| `certificateArn` | string | none | ACM certificate ARN to attach to any LB listener mapped to port 443. Enables TLS termination at the load balancer. |
| `mapOpensearchPortTo` | number | `80` (no security) / `443` (security) | The port on the load balancer that maps to OpenSearch's port 9200. |
| `mapOpensearchDashboardsPortTo` | number | `8443` | The port on the load balancer that maps to Dashboards' port 5601. |
| `loadBalancerType` | string | `nlb` | Type of load balancer. Valid values: `nlb` (Network Load Balancer) or `alb` (Application Load Balancer). |
| `enableGrpc` | boolean | `false` | Enables gRPC endpoints via the `transport-grpc` module. Requires OpenSearch 3.0+. |
| `mapGrpcPortTo` | number | `9450` | Load balancer port for gRPC when `enableGrpc=true`. |
| `networkStackSuffix` | string | none | Suffix appended to the network stack name. Useful when deploying multiple clusters with different network stacks. |
| `cidr` | string | `10.0.0.0/16` | CIDR block for the new VPC (only used when `vpcId` is not provided). |
| `securityGroupId` | string | none | Reuse an existing security group instead of creating a new one. |

---

## Gathering Information from the User

Ask the user for these values. Use the defaults shown if the user doesn't have a preference:

1. **What OpenSearch version?** (e.g., `3.7.0`, `2.19.0`)
2. **Distribution URL?** (the tar.gz link — release or CI build)
3. **Security enabled or disabled?** (default: disabled)
4. **If security enabled and version >= 2.12.0**: What admin password?
5. **CPU architecture?** (default: `x64`)
6. **AWS region?** (default: `us-east-1`)
7. **AWS account ID?** (can get from `aws sts get-caller-identity`)
8. **Prefix list ID for access restriction?** (default: `pl-60b85b09`)
9. **Instance type?** (default: `r5.xlarge` — suggest `c6a.4xlarge` for benchmarks)
10. **EBS storage size in GB?** (default: `100`)
11. **Stack suffix?** (MUST be unique — suggest something like `<username>-test`)
12. **Existing VPC ID?** (optional — skip to create new)
13. **Custom IAM role ARN?** (optional — skip to create new)
14. **Any additional opensearch.yml config?** (optional — JSON string)
15. **Install Dashboards?** (optional — need dashboards tar URL)

---

## Deploy Command Construction

Build the `cdk deploy` command using the gathered parameters:

```bash
cdk deploy "*" \
  -c distVersion='<VERSION>' \
  -c distributionUrl='<DISTRIBUTION_URL>' \
  -c securityDisabled=<true|false> \
  -c minDistribution=false \
  -c cpuArch='<x64|arm64>' \
  -c singleNodeCluster=true \
  -c serverAccessType=prefixList \
  -c restrictServerAccessTo=<PREFIX_LIST_ID> \
  -c dataInstanceType=<INSTANCE_TYPE> \
  -c dataNodeStorage=<STORAGE_GB> \
  -c region=<REGION> \
  -c account=<ACCOUNT_ID> \
  -c suffix=<SUFFIX> \
  --require-approval=never \
  --no-rollback
```

**Conditionally add these flags:**
- If user provided a VPC ID: add `-c vpcId=<VPC_ID>`
- If user provided a custom role: add `-c customRoleArn=<ROLE_ARN>`
- If security enabled + version >= 2.12.0: add `-c adminPassword='<PASSWORD>'`
- If user wants Dashboards: add `-c dashboardsUrl='<DASHBOARDS_URL>'`
- If user provided additional config: add `-c additionalConfig='<JSON>'`
- If user wants internal NLB: add `-c isInternal=true`
- If user wants remote store: add `-c enableRemoteStore=true`
- If user specified heap size: add `-c heapSizeInGb=<N>`

**Flags explained:**
- `--require-approval=never` — deploys without asking for manual confirmation (safe for dev/test)
- `--no-rollback` — if deployment fails, keeps the resources so you can debug via CloudWatch logs or SSM

---

## Execution Steps

### Step 1: Bootstrap (first time per account+region only)

```bash
cdk bootstrap aws://<ACCOUNT_ID>/<REGION> \
  -c distVersion='<VERSION>' \
  -c distributionUrl='<URL>' \
  -c securityDisabled=true \
  -c minDistribution=false \
  -c cpuArch='x64' \
  -c singleNodeCluster=true \
  -c serverAccessType=prefixList \
  -c restrictServerAccessTo=<PREFIX_LIST_ID>
```

If it says "already bootstrapped" or "Environment ... is already bootstrapped", that's fine — proceed to deploy.

### Step 2: Deploy

Run the constructed `cdk deploy` command. Deployment typically takes 5-10 minutes.

### Step 3: Capture output

After successful deployment, CDK prints outputs including:
- **Load Balancer URL** — the endpoint to access OpenSearch
- **EC2 Instance ID** — needed for SSM access

Report both to the user.

### Step 4: Verify cluster health

Only works if you're on VPN or Cloud Desktop (prefix list restriction):

```bash
# Security disabled
curl http://<LB_URL>/_cluster/health?pretty

# Security enabled
curl https://<LB_URL>/_cluster/health?pretty -u 'admin:<password>' --insecure
```

If the curl hangs or times out, it means you're not on VPN/Cloud Desktop or the prefix list doesn't include your IP.

---

## Post-Deploy Information to Share with User

After successful deployment, tell the user:

1. **Cluster access**: Only accessible over **VPN** or **Cloud Desktop** (prefix list restriction). Not publicly accessible.

2. **If accessing from another EC2**: Add an inbound rule to the security group:
   ```bash
   SG_ID=$(aws ec2 describe-security-groups \
     --filters "Name=tag:aws:cloudformation:stack-name,Values=opensearch-network-stack" \
     --query "SecurityGroups[0].GroupId" --output text)
   
   aws ec2 authorize-security-group-ingress \
     --group-id $SG_ID \
     --protocol tcp \
     --port 9200 \
     --cidr <EC2_PRIVATE_IP>/32
   ```

3. **SSM into the instance**:
   ```bash
   aws ssm start-session --target <INSTANCE_ID>
   # Then:
   sudo su - ec2-user
   ```

4. **Key paths on the EC2 instance**:
   - OpenSearch home: `/home/ec2-user/opensearch/`
   - Config: `/home/ec2-user/opensearch/config/opensearch.yml`
   - JVM options: `/home/ec2-user/opensearch/config/jvm.options`
   - Logs: `/home/ec2-user/opensearch/logs/`
   - Install log: `/home/ec2-user/opensearch/install.log`
   - Plugins: `/home/ec2-user/opensearch/plugins/`

5. **CloudWatch logs**: Log group name is `opensearch-infra-stack-<SUFFIX>LogGroup/opensearch.log`. Each instance creates its own log stream named by instance ID.

6. **OS**: Amazon Linux 2023 (AL2023)

7. **Port mapping**:
   - LB port 80 (no security) or 443 (security) → OpenSearch port 9200
   - LB port 8443 → Dashboards port 5601

---

## Teardown

To destroy the cluster and all resources:

```bash
cdk destroy --all \
  -c distVersion='<VERSION>' \
  -c distributionUrl='<DISTRIBUTION_URL>' \
  -c securityDisabled=<true|false> \
  -c minDistribution=false \
  -c cpuArch='<x64|arm64>' \
  -c singleNodeCluster=true \
  -c serverAccessType=prefixList \
  -c restrictServerAccessTo=<PREFIX_LIST_ID> \
  -c suffix=<SUFFIX>
```

You MUST pass the same context parameters that were used during deploy, otherwise CDK cannot identify the stacks.

---

## Error Handling

| Error | Cause | Action |
|-------|-------|--------|
| `Unable to resolve AWS account` or credential errors | AWS credentials expired or not configured | Ask user to run `ada credentials update --account <ID> --provider isengard --role Admin --once` |
| `Stack [name] already exists` | Another stack with the same name exists in the account | Ask user for a different `suffix` value |
| `CDKToolkit stack not found` or bootstrap errors | CDK hasn't been bootstrapped in this account+region | Run the bootstrap step first |
| Deployment timeout (stack stuck in CREATE_IN_PROGRESS) | OpenSearch failed to start on the instance | Check CloudWatch log group `opensearch-infra-stack-<suffix>LogGroup/opensearch.log` for errors. SSM into the instance and check `/home/ec2-user/opensearch/install.log` |
| `adminPassword is required` | Security is enabled on version >= 2.12.0 but no password provided | Ask user for an admin password meeting complexity requirements |
| `cpuArch parameter is required` | Missing cpuArch context | Add `-c cpuArch=x64` or `-c cpuArch=arm64` |
| Instance type not recognized | Invalid `dataInstanceType` value | Use one of the valid instance types listed in the parameters section above |
| `serverAccessType and restrictServerAccessTo parameters are required` | Missing access control params | Add both `-c serverAccessType=prefixList -c restrictServerAccessTo=<ID>` |
