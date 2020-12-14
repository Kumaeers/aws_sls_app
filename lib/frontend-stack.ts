import { Bucket } from '@aws-cdk/aws-s3';
import { CfnOutput, Construct, Duration, RemovalPolicy, Stack, StackProps } from "@aws-cdk/core";
import { BucketDeployment, Source } from '@aws-cdk/aws-s3-deployment';
import { CloudFrontWebDistribution, PriceClass, OriginAccessIdentity } from '@aws-cdk/aws-cloudfront'
import { CanonicalUserPrincipal, Effect, PolicyStatement } from '@aws-cdk/aws-iam';

export class FrontendStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // フロント配信用のS3バケット
        const websiteBucket = new Bucket(this, "Website", {
            removalPolicy: RemovalPolicy.DESTROY
        });

        // CloudFrontからS3へのアクセスを許可するOriginAccessIdentity
        const OAI = new OriginAccessIdentity(this, 'OAI');

        // OAIのバケットポリシーを作成
        const websiteBucketPolicyStatement = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['s3:GetObject'],
            resources: [`websiteBucket.bucketArn/*`],
            principals: [new CanonicalUserPrincipal(OAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
        });
        // websiteBucket.addToResourcePolicy(websiteBucketPolicyStatement);

        const distribution = new CloudFrontWebDistribution(this,'WebsiteDistribution',{
            // 取得するoriginの設定
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: websiteBucket,
                        originAccessIdentity: OAI
                    },
                    behaviors: [{
                        isDefaultBehavior: true,
                        // minTtl: Duration.seconds(0),
                        // maxTtl: Duration.seconds(0),
                        // defaultTtl: Duration.seconds(0),
                    }]
                }
            ],
            errorConfigurations: [
                // errorの場合のリダイレクト設定
                {
                    errorCode: 403,
                    responsePagePath: '/index.html',
                    responseCode: 200,
                    errorCachingMinTtl: 0
                },
                {
                    errorCode: 404,
                    responsePagePath: '/index.html',
                    responseCode: 200,
                    errorCachingMinTtl: 0
                }
            ],
            // 日本を含むエッジロケーションの料金クラス
            priceClass: PriceClass.PRICE_CLASS_200
        });

        new BucketDeployment(this,'DeployWebsite',{
          sources: [Source.asset('src/frontend/dist')]  ,
          destinationBucket: websiteBucket,
          distribution: distribution,
          distributionPaths: ['/*']
        });

        // cloudFormationでOutputされるもの
        new CfnOutput(this, 'URL', {value: `https://${distribution.domainName}/`})

    }
}