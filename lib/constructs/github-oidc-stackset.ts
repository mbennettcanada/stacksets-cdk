import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from "aws-cdk-lib/aws-s3";
import * as serviceCatalog from 'aws-cdk-lib/aws-servicecatalog';
import { GithubOIDCProviderStacksetTemplate } from '../stackset-templates/github-oidc-provider';
import path = require('path');
import { StacksetInstancesWaiter } from './stackset-instances-waiter';


export interface GithubOIDCProviderStacksetProps {
    stacksetName: string;
    stacksetRegions: string[];
    targetAccounts: string[];
    targetOrgUnits: string[];
    assetBucketName: string;
}

export class GithubOIDCProviderStackset extends Construct {

    constructor(scope: Construct, id: string, props: GithubOIDCProviderStacksetProps) {
        super(scope, id);
        if (props.targetOrgUnits.length == 0) {
            throw new Error(`targetOrgUnits must be specified to bootstrap cdk for ${props.stacksetName}`);
        }
        const stackTemplate = new GithubOIDCProviderStacksetTemplate(this, `${props.stacksetName}-template`, {
            assetBucket: s3.Bucket.fromBucketName(this, "stagingBucket", props.assetBucketName),
            
        });
        if (props.targetAccounts.length > 0) { // if accounts are provided, don't deploy to the whole ou. 
            const stackset = new cdk.CfnStackSet(this, props.stacksetName, {
                permissionModel: "SERVICE_MANAGED", //SERVICE_MANAGED is the only type of deployment supported by delegated admin stackset accounts
                stackSetName: props.stacksetName,
                autoDeployment: {
                    enabled: true,
                    retainStacksOnAccountRemoval: false,
                },
                callAs: "DELEGATED_ADMIN", //required for delegated admin account
                description:
                    `${props.stacksetName} StackSet managed with CDK`,
                capabilities: [
                    'CAPABILITY_IAM',
                    'CAPABILITY_NAMED_IAM'],
                templateUrl: serviceCatalog.CloudFormationTemplate.fromProductStack(stackTemplate).bind(this).httpUrl,
                stackInstancesGroup: [
                    {
                        regions: props.stacksetRegions,
                        deploymentTargets: {
                            organizationalUnitIds: props.targetOrgUnits,
                            accounts: props.targetAccounts,
                            accountFilterType: "INTERSECTION"  //This limits to the specific accounts in the 'accounts' property.
                        },
                    }],
                parameters: [],
                operationPreferences: {
                    failureToleranceCount: 1,
                    maxConcurrentCount: 30,
                }
            });
            const stacksetWaiter = new StacksetInstancesWaiter(this, `${props.stacksetName}-waiter`, { stackSetName: stackset.stackSetName })
            stacksetWaiter.node.addDependency(stackset);
        }
        else {
            const stackset = new cdk.CfnStackSet(this, props.stacksetName, {
                permissionModel: "SERVICE_MANAGED", //SERVICE_MANAGED is the only type of deployment supported by delegated admin stackset accounts
                stackSetName: props.stacksetName,
                autoDeployment: {
                    enabled: true,
                    retainStacksOnAccountRemoval: false,
                },
                callAs: "DELEGATED_ADMIN", //required for delegated admin account
                description:
                    `${props.stacksetName} StackSet managed with CDK`,
                capabilities: [
                    'CAPABILITY_IAM',
                    'CAPABILITY_NAMED_IAM'],
                templateUrl: serviceCatalog.CloudFormationTemplate.fromProductStack(stackTemplate).bind(this).httpUrl,
                stackInstancesGroup: [
                    {
                        regions: props.stacksetRegions,
                        deploymentTargets: {
                            organizationalUnitIds: props.targetOrgUnits,
                            accountFilterType: "NONE"
                        },
                    }],
                parameters: [],
                operationPreferences: {
                    failureToleranceCount: 1,
                    maxConcurrentCount: 30,
                }
            });
            const stacksetWaiter = new StacksetInstancesWaiter(this, `${props.stacksetName}-waiter`, { stackSetName: stackset.stackSetName })
            stacksetWaiter.node.addDependency(stackset);
        }
    }
}
