import {Code, Function, Runtime} from '@aws-cdk/aws-lambda';
import {ApiDefinition, Cors, LambdaIntegration, RestApi} from '@aws-cdk/aws-apigateway';
import {AttributeType, BillingMode, Table} from '@aws-cdk/aws-dynamodb';
import {Construct, Stack, StackProps} from '@aws-cdk/core';
import {StringParameter} from '@aws-cdk/aws-ssm'
import {RetentionDays} from '@aws-cdk/aws-logs';
import {HTTPMethod} from 'http-method-enum';

export class BackendStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
    
        super(scope,id,props);

        // APIGateway
        const api = new RestApi(this, 'RestApi', {
            restApiName: 'BackendApi',
            // バックエンドとフロントエンドのドメインが異なるためCORSの設定をする
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS,
                allowCredentials: true,
                allowMethods: Cors.ALL_METHODS,
            }
        });

        // DynamoDB
        const personsTable = new Table(this,'PersonsTable',{
            // リクエストに対して自動でスケールするMODE
            billingMode: BillingMode.PAY_PER_REQUEST,
            // PartitionKey:id,Attribute1: FirstName,Attribute2: LastName
            partitionKey: {name: 'Id', type: AttributeType.STRING}
        });

        // Lambda
        const personsFunc = new Function(this, 'PersonsFunc', {
            code: Code.fromAsset('./src/backend/persons'),
            handler: 'persons',
            runtime: Runtime.GO_1_X,
            environment: {
                // DynamoDBのテーブルを指定
                'TABLE_NAME': personsTable.tableName
            },
            // CloudWatchLogsに保存されるログの期限を2週間に設定して節約
            logRetention: RetentionDays.TWO_WEEKS,
        });
        // テーブルに対してpersonsFuncが読み書きできるIAMロールを付与
        personsTable.grantReadWriteData(personsFunc);

        const personsInteg = new LambdaIntegration(personsFunc);

        // APIGateWayとLambdaの関連付け
        const personsPath = api.root.addResource('persons');
        const personIdPath = personsPath.addResource('{personId}');
        // GET:persons/ 一覧取得
        personsPath.addMethod(HTTPMethod.GET, personsInteg);
        // POST:persons/ ユーザー登録
        personsPath.addMethod(HTTPMethod.POST, personsInteg);
        // DELETE:persons/{personsId} ユーザー削除
        personIdPath.addMethod(HTTPMethod.DELETE, personsInteg);

        // SSM Parameter StoreにAPIのURLをエクスポート
        // フロントで使用する
        new StringParameter(this,'ApiUrlParam', {
            parameterName: `/${this.stackName}/ApiUrl`,
            stringValue: api.url,
        });

    }
}