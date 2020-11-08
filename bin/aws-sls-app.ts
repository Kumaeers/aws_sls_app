#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsSlsAppStack } from '../lib/aws-sls-app-stack';

const app = new cdk.App();
new AwsSlsAppStack(app, 'AwsSlsAppStack');
