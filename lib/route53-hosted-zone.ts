import * as cdk from 'aws-cdk-lib/core';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { Route53HostedZoneProps } from '../props/route53-hosted-zone-props';

export { Route53HostedZoneProps };

/**
 * Creates a Route 53 public hosted zone for the domain.
 *
 * After deployment, copy the four NS record values from the stack outputs
 * and paste them as the name servers in your domain registrar.
 * That is the only manual step — all future DNS records are managed by CDK.
 */
export class Route53HostedZone extends Construct {
  /** The public hosted zone — pass to SesDomainIdentity for auto DNS wiring. */
  public readonly hostedZone: route53.PublicHostedZone;

  constructor(scope: Construct, id: string, props: Route53HostedZoneProps) {
    super(scope, id);

    this.hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName: props.zoneName,
    });

    // ── Output NS records to copy into your domain registrar ─────────────────
    const cfnZone = this.hostedZone.node.defaultChild as route53.CfnHostedZone;
    const stackName = cdk.Stack.of(this).stackName;

    [0, 1, 2, 3].forEach((i) => {
      new cdk.CfnOutput(this, `NameServer${i + 1}`, {
        description: `Name server ${i + 1} of 4 — paste all four into your domain registrar`,
        value: cdk.Fn.select(i, cfnZone.attrNameServers),
        exportName: `${stackName}-NS${i + 1}`,
      });
    });
  }
}
