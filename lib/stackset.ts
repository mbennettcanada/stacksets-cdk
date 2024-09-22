import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { GithubOIDCProviderStackset } from './constructs/github-oidc-stackset';

export class DeployGithubProviderStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const githubStackset = new GithubOIDCProviderStackset(this, "GithubOIDCProviderStackset", {
            stacksetName: "GithubOIDCStackset",
            stacksetRegions: ["us-east-2"],
            targetAccounts: [], // If narrowing down to specific accounts, put those ID's here.
            targetOrgUnits: ["ou-wivp-spzyzet9"],
            assetBucketName: "cdk-orgshared-assets-761018853327-us-east-2" // This is setup in your cdk bootstrap. Get bucket name there. 
        })
    }
}