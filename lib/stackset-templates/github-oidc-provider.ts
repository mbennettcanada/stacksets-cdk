import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as serviceCatalog from "aws-cdk-lib/aws-servicecatalog";
import path = require("path");
import { IBucket } from "aws-cdk-lib/aws-s3/lib/bucket";

interface GithubOIDCProviderStacksetTemplateProps extends serviceCatalog.ProductStackProps {
    assetBucket: IBucket; //this would be used for deploying any assets for lambdas to be deployed by this stackset. CDK would deploy to that bucket via the delegated admin account. It should be available to any account that the stackset is deployed to. 
}

export class GithubOIDCProviderStacksetTemplate extends serviceCatalog.ProductStack {
    constructor(scope: Construct, id: string, props: GithubOIDCProviderStacksetTemplateProps) {
        super(scope, id, props);
        const githubDomain = 'token.actions.githubusercontent.com';
        const ghProvider = new cdk.aws_iam.OpenIdConnectProvider(this, 'githubProvider', {
            url: `https://${githubDomain}`,
            clientIds: ['sts.amazonaws.com'],
          });
    }
}

