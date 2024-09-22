import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import path = require('path');

export interface StacksetInstancesWaiterProps {

    // The name of the stackset to inspect for instances and wait for completion
    readonly stackSetName: string;

}

export class StacksetInstancesWaiter extends Construct {

    constructor(scope: Construct, id: string, props: StacksetInstancesWaiterProps) {
        super(scope, id);
        //Stackset instance waiter custom resource
        const waiterRole = new iam.Role(this, 'WaiterRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
            inlinePolicies: {
                'WaiterPolicy': new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            effect: iam.Effect.ALLOW,
                            actions: [
                                'cloudformation:ListStackInstances',
                                'organizations:ListDelegatedAdministrators'
                            ],
                            resources: ["*"]
                        })
                    ]
                })
            }
        })

        const handlerCommonConfig = {
            runtime: lambda.Runtime.PYTHON_3_11,
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambdas/stackset-waiter')),
            role: waiterRole,
            timeout: cdk.Duration.minutes(15),
        }
        const onEventHandler = new lambda.Function(this, 'OnEvent', {
            ...handlerCommonConfig,
            handler: 'index.on_event',
        })

        const isCompleteHandler = new lambda.Function(this, 'IsComplete', {
            ...handlerCommonConfig,
            handler: 'index.is_complete',
        })

        const provider = new cr.Provider(this, 'Provider', {
            onEventHandler,
            isCompleteHandler,
            queryInterval: cdk.Duration.minutes(15),
            totalTimeout: cdk.Duration.hours(1)
        })

        const StacksetWaiter = new cdk.CustomResource(this, 'StacksetWaiter', {
            serviceToken: provider.serviceToken,
            properties: {
                stackSetName: props.stackSetName,
                datetime: new Date().toISOString()
            }
        })
    }
}