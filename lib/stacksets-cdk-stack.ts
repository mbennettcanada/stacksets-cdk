import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from 'aws-cdk-lib/pipelines';
import { DeployGithubProviderStage } from './pipeline-stage';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class StacksetsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'cdk-stacksets-pipeline',
      selfMutation: true,
      synth: new CodeBuildStep('SynthStep', {
        input: CodePipelineSource.connection('mbennettcanada/stacksets-cdk', 'main',{connectionArn: "arn:aws:codestar-connections:us-east-2:761018853327:connection/27a113c9-a53d-41f9-ade6-7f4e88c9a492"}),
        installCommands: [
          'npm install -g aws-cdk'
        ],
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth'
        ]
      }
      )
    });
    const deployWave = pipeline.addWave('DeployChanges');
    const iamIdentityCenterStage = new DeployGithubProviderStage(this, 'Deploy');
    deployWave.addStage(iamIdentityCenterStage);

    pipeline.buildPipeline()

  }
}
