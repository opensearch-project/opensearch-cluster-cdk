# Getting Started: Deploy a Single-Node OpenSearch Cluster

This guide walks you through deploying a single-node OpenSearch cluster on AWS using this CDK project. No prior CDK knowledge is required.

## Prerequisites

- **Node.js** (v14+) and **npm** installed — [Download Node.js](https://nodejs.org/)
- **AWS CLI** installed — [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **AWS CDK CLI** installed globally:
  ```bash
  npm install -g aws-cdk
  ```
- An **AWS account** with permissions to create EC2, VPC, Load Balancer, IAM, and CloudWatch resources.

## Step 1: Get AWS Credentials

You need valid AWS credentials configured in your terminal. Choose one of the methods below:

### Option A: Using `ada` (Amazon internal)

```bash
ada credentials update --account <AWS_ACCOUNT_ID> --provider isengard --role Admin --once
```

This writes temporary credentials to `~/.aws/credentials` under the `default` profile.

### Option B: Export credentials manually from Isengard Console

1. Go to [Isengard](https://isengard.amazon.com/) and find your AWS account.
2. Click **Console Access** → select your role (e.g., Admin).
3. Click **Credentials** (the key icon) to reveal temporary credentials.
4. Copy and export them in your terminal:

```bash
export AWS_ACCESS_KEY_ID="<your-access-key>"
export AWS_SECRET_ACCESS_KEY="<your-secret-key>"
export AWS_SESSION_TOKEN="<your-session-token>"
export AWS_DEFAULT_REGION="us-east-1"  # or your preferred region
```

### Verify credentials are working

```bash
aws sts get-caller-identity
```

You should see your account ID and role ARN.

## Step 2: Clone and Install Dependencies

```bash
git clone https://github.com/opensearch-project/opensearch-cluster-cdk.git
cd opensearch-cluster-cdk
npm install
```

## Step 3: Understand What Gets Deployed

This CDK project deploys **two CloudFormation stacks**:

| Stack | Name | What it creates |
|-------|------|-----------------|
| Network Stack | `opensearch-network-stack` | VPC (with public + private subnets), Security Group |
| Infra Stack | `opensearch-infra-stack` | EC2 instance (in an ASG), Network Load Balancer, CloudWatch log group, IAM role |

The **Security Group** created is named `osSecurityGroup` (logical ID in CloudFormation). It opens the following inbound ports to the CIDR/IP you specify:
- Port 80 (HTTP — OpenSearch when security is disabled)
- Port 443 (HTTPS — OpenSearch when security is enabled)
- Port 9200 (OpenSearch direct)
- Port 5601 (Dashboards direct)
- Port 8443 (Dashboards via LB)
- All traffic within the security group itself (for inter-node communication)

## Step 4: Required Parameters for a Single-Node Cluster

| Parameter | Value | Description |
|-----------|-------|-------------|
| `distVersion` | e.g., `2.19.0` | OpenSearch version to deploy |
| `distributionUrl` | URL to the `.tar.gz` | The OpenSearch tar bundle download URL |
| `securityDisabled` | `true` or `false` | Whether to disable the security plugin |
| `minDistribution` | `true` or `false` | `true` = minimal distribution (no plugins), `false` = full bundle |
| `cpuArch` | `x64` or `arm64` | CPU architecture for the EC2 instance |
| `singleNodeCluster` | `true` | **Must be `true`** for single-node |
| `serverAccessType` | `ipv4` | How to restrict LB access |
| `restrictServerAccessTo` | e.g., `0.0.0.0/0` or your IP CIDR | Who can access the LB |

### Optional but useful parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `dataInstanceType` | `r5.xlarge` | EC2 instance type. Use `m5.xlarge`, `r5.2xlarge`, etc. |
| `dataNodeStorage` | `100` (GB) | EBS volume size |
| `dashboardsUrl` | none | URL to OpenSearch Dashboards tar to also install Dashboards |
| `adminPassword` | none | **Required** if security is enabled AND version >= 2.12.0 |
| `suffix` | none | Appended to infra stack name (useful to avoid name conflicts) |
| `additionalConfig` | none | Extra `opensearch.yml` settings as JSON |
| `mapOpensearchPortTo` | 80 (no security) / 443 (security) | LB port for OpenSearch |
| `heapSizeInGb` | ~50% of system memory | Explicit JVM heap size |

## Step 5: Bootstrap CDK (First Time Only)

If you've never used CDK in this AWS account + region, run bootstrap first:

```bash
cdk bootstrap aws://<ACCOUNT_ID>/<REGION> \
  --context distVersion='2.19.0' \
  --context distributionUrl='https://artifacts.opensearch.org/releases/bundle/opensearch/2.19.0/opensearch-2.19.0-linux-x64.tar.gz' \
  --context securityDisabled=true \
  --context minDistribution=false \
  --context cpuArch='x64' \
  --context singleNodeCluster=true \
  --context serverAccessType=ipv4 \
  --context restrictServerAccessTo='0.0.0.0/0'
```

## Step 6: Deploy the Cluster

```bash
cdk deploy "*" \
  --context distVersion='2.19.0' \
  --context distributionUrl='https://artifacts.opensearch.org/releases/bundle/opensearch/2.19.0/opensearch-2.19.0-linux-x64.tar.gz' \
  --context securityDisabled=true \
  --context minDistribution=false \
  --context cpuArch='x64' \
  --context singleNodeCluster=true \
  --context serverAccessType=ipv4 \
  --context restrictServerAccessTo='0.0.0.0/0'
```

CDK will show you the resources it plans to create and ask for confirmation. Type `y` to proceed.

### Example with security enabled (version >= 2.12.0)

```bash
cdk deploy "*" \
  --context distVersion='2.19.0' \
  --context distributionUrl='https://artifacts.opensearch.org/releases/bundle/opensearch/2.19.0/opensearch-2.19.0-linux-x64.tar.gz' \
  --context securityDisabled=false \
  --context adminPassword='MyStr0ngP@ss!' \
  --context minDistribution=false \
  --context cpuArch='x64' \
  --context singleNodeCluster=true \
  --context serverAccessType=ipv4 \
  --context restrictServerAccessTo='0.0.0.0/0'
```

### Example with a suffix (to avoid stack name conflicts)

```bash
cdk deploy "*" \
  --context distVersion='2.19.0' \
  --context distributionUrl='https://artifacts.opensearch.org/releases/bundle/opensearch/2.19.0/opensearch-2.19.0-linux-x64.tar.gz' \
  --context securityDisabled=true \
  --context minDistribution=false \
  --context cpuArch='x64' \
  --context singleNodeCluster=true \
  --context serverAccessType=ipv4 \
  --context restrictServerAccessTo='0.0.0.0/0' \
  --context suffix='my-test'
```

This creates stacks named `opensearch-network-stack` and `opensearch-infra-stack-my-test`.

## Step 7: Access Your Cluster

After deployment completes, CDK outputs the **Load Balancer URL**.

### Security disabled (HTTP)

```bash
curl http://<LOAD_BALANCER_URL>/_cluster/health?pretty
```

### Security enabled (HTTPS)

```bash
curl https://<LOAD_BALANCER_URL>/_cluster/health?pretty -u 'admin:<your-admin-password>' --insecure
```

### OpenSearch Dashboards (if deployed)

Open in browser: `http://<LOAD_BALANCER_URL>:8443`

## Step 8: SSH into the EC2 Instance via SSM

The EC2 instances are in a **private subnet** — there is no SSH access. You must use **AWS Systems Manager Session Manager**.

### From the AWS Console

1. Go to **AWS Console** → **EC2** → **Instances**.
2. Find the instance (its name will contain your stack name, e.g., `opensearch-infra-stack/singleNodeLt`).
3. Select the instance → click **Connect** → choose **Session Manager** tab → click **Connect**.

### From the CLI

```bash
# Find your instance ID
aws ec2 describe-instances \
  --filters "Name=tag:aws:cloudformation:stack-name,Values=opensearch-infra-stack" \
  --query "Reservations[].Instances[].InstanceId" --output text

# Start a session
aws ssm start-session --target <INSTANCE_ID>
```

Once connected, switch to the `ec2-user`:

```bash
sudo su - ec2-user
```

## Step 9: Navigating the EC2 Instance

### OpenSearch installation path

```
/home/ec2-user/opensearch/
```

Key directories inside:
- `config/opensearch.yml` — main configuration
- `config/jvm.options` — JVM settings
- `logs/` — local OpenSearch logs
- `bin/opensearch` — the binary
- `plugins/` — installed plugins

### Check if OpenSearch is running

```bash
ps aux | grep opensearch
# or
curl -s localhost:9200
```

### View local logs on the instance

```bash
# The log file is named after the cluster:
ls /home/ec2-user/opensearch/logs/
# Typically: opensearch-infra-stack-<account>-<region>.log
tail -f /home/ec2-user/opensearch/logs/*.log
```

### View install log

```bash
cat /home/ec2-user/opensearch/install.log
```

## Step 10: View Logs in CloudWatch

OpenSearch logs are shipped to **CloudWatch Logs** automatically.

- **Log Group**: `opensearch-infra-stackLogGroup/opensearch.log`
  - (If you used a suffix: `opensearch-infra-stack-<suffix>LogGroup/opensearch.log`)
- **Log Stream**: Named after the EC2 instance ID.

To view in the console:
1. Go to **CloudWatch** → **Log groups**.
2. Find the log group matching your stack name.
3. Click into the log stream to see OpenSearch logs.

## Teardown

To delete everything when you're done:

```bash
cdk destroy --all \
  --context distVersion='2.19.0' \
  --context distributionUrl='https://artifacts.opensearch.org/releases/bundle/opensearch/2.19.0/opensearch-2.19.0-linux-x64.tar.gz' \
  --context securityDisabled=true \
  --context minDistribution=false \
  --context cpuArch='x64' \
  --context singleNodeCluster=true \
  --context serverAccessType=ipv4 \
  --context restrictServerAccessTo='0.0.0.0/0'
```

You must pass the same context parameters used during deploy so CDK can identify the stacks.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `cdk deploy` fails with credential errors | Re-run `ada credentials update` or re-export credentials |
| Stack creation times out | Check CloudWatch logs for OpenSearch startup errors |
| Can't reach the LB URL | Verify `restrictServerAccessTo` includes your IP. Check security group inbound rules in the EC2 console |
| OpenSearch not starting | SSM into the instance, check `install.log` and `opensearch/logs/` |
| `adminPassword` error | Required for security-enabled clusters on version >= 2.12.0 |

## Quick Reference

| Item | Value |
|------|-------|
| OS on EC2 | Amazon Linux 2 |
| OpenSearch install path | `/home/ec2-user/opensearch/` |
| OpenSearch config | `/home/ec2-user/opensearch/config/opensearch.yml` |
| OpenSearch logs (local) | `/home/ec2-user/opensearch/logs/` |
| CloudWatch log group | `<infra-stack-name>LogGroup/opensearch.log` |
| LB port (no security) | 80 → 9200 |
| LB port (security) | 443 → 9200 |
| Dashboards LB port | 8443 → 5601 |
| EC2 access method | SSM Session Manager (no SSH) |
| Security Group logical ID | `osSecurityGroup` |
