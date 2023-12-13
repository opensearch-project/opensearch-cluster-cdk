/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Alarm, ComparisonOperator, Dashboard, TreatMissingData } from "aws-cdk-lib/aws-cloudwatch";
import { InfraStack } from "../infra/infra-stack";

export class Monitoring {
    public readonly alarms: Alarm[] = []

    constructor(stack: InfraStack) {
        const alarmDashboard = new Dashboard(stack, 'AlarmDashboard');
        this.alarms.push(new Alarm(stack, 'OpenSearchProcessNotFound', {
            alarmDescription: 'OpenSearch Process not found',
            metric: stack.alarmMetrics.openSearchProcessNotFound.with({statistic: 'avg'}),
            evaluationPeriods: 3,
            threshold: 1,
            datapointsToAlarm: 3,
            comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
            treatMissingData: TreatMissingData.IGNORE,
        }));

        this.alarms.push(new Alarm(stack, 'OpenSearchDashboardsProcessNotFound', {
            alarmDescription: 'OpenSearch Dashboards Process not found',
            metric: stack.alarmMetrics.openSearchDashboardsProcessNotFound.with({statistic: 'avg'}),
            evaluationPeriods: 3,
            threshold: 1,
            datapointsToAlarm: 3,
            comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
            treatMissingData: TreatMissingData.IGNORE,
        }))

        this.alarms.push(new Alarm(stack, 'HighMemoryUtilization', {
            alarmDescription: 'The process is using more memory than expected',
            metric: stack.alarmMetrics.memUsed.with({ statistic: 'avg' }),
            evaluationPeriods: 5,
            threshold: 65,
            comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treatMissingData: TreatMissingData.IGNORE,
          }));
        
        this.alarms.push(new Alarm(stack, 'HighDiskUtilization',{
            alarmDescription: 'High disk utilization found',
            metric: stack.alarmMetrics.diskUsed.with({statistic: 'avg'}),
            evaluationPeriods: 5,
            threshold: 70,
            comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treatMissingData: TreatMissingData.IGNORE,
        }))
    }
}