import { DeployGithubProviderStack } from './stackset';

import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class DeployGithubProviderStage  extends Stage {
    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);

        new DeployGithubProviderStack(this, 'DeployGithubProvider');
    }
}

