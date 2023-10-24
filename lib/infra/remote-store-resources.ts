import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class RemoteStoreResources {
    private readonly snapshotS3Bucket: Bucket

    private readonly bucketPolicyStatement: PolicyStatement

    constructor(scope: Stack) {
      this.snapshotS3Bucket = new Bucket(scope, `remote-store-${scope.stackName}`, {
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        bucketName: `${scope.stackName}`,
      });

      this.bucketPolicyStatement = new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
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
        resources: [this.snapshotS3Bucket.bucketArn, `${this.snapshotS3Bucket.bucketArn}/*`],
      });
    }

    public getRemoteStoreBucketPolicy() {
      return this.bucketPolicyStatement;
    }
}
