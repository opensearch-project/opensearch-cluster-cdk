/**
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import {
  Alarm, AlarmWidget, ComparisonOperator, Dashboard, MathExpression, Metric, TreatMissingData,
} from 'aws-cdk-lib/aws-cloudwatch';
import { InfraStack } from '../infra/infra-stack';

export class InfraStackMonitoring {
    public readonly alarmMetrics: {
      memUsed: Metric | MathExpression,
      diskUsed: Metric| MathExpression,
      openSearchProcessNotFound: Metric | MathExpression,
      openSearchDashboardsProcessNotFound?: Metric | MathExpression,
    }

    public readonly alarms: Alarm[] = []

    constructor(infraStack: InfraStack, dashboardsUrl: string) {
      this.alarmMetrics = {
        memUsed: new Metric({
          metricName: 'mem_used_percent',
          namespace: `${infraStack.stackName}/InfraStack`,
        }),
        diskUsed: new MathExpression({
          expression: `SELECT AVG(disk_used_percent) FROM "${infraStack.stackName}/InfraStack" WHERE "fstype" = 'xfs'`,
        }),
        openSearchProcessNotFound: new MathExpression({
          expression: `SELECT AVG(procstat_lookup_pid_count) FROM "${infraStack.stackName}/InfraStack" WHERE "pattern" = '-Dopensearch'`,
        }),
        openSearchDashboardsProcessNotFound: new MathExpression({
          expression: `SELECT AVG(procstat_lookup_pid_count) FROM "${infraStack.stackName}/InfraStack" WHERE "pattern" = 'opensearch-dashboards'`,
        }),
      };
      const alarmDashboard = new Dashboard(infraStack, 'AlarmDashboard');
      this.alarms.push(new Alarm(infraStack, 'OpenSearchProcessNotFound', {
        alarmDescription: 'OpenSearch Process not found',
        metric: this.alarmMetrics.openSearchProcessNotFound.with({ statistic: 'avg' }),
        evaluationPeriods: 3,
        threshold: 1,
        datapointsToAlarm: 3,
        comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
        treatMissingData: TreatMissingData.IGNORE,
      }));

      if (dashboardsUrl !== 'undefined' && this.alarmMetrics.openSearchDashboardsProcessNotFound !== undefined) {
        this.alarms.push(new Alarm(infraStack, 'OpenSearchDashboardsProcessNotFound', {
          alarmDescription: 'OpenSearch Dashboards Process not found',
          metric: this.alarmMetrics.openSearchDashboardsProcessNotFound.with({ statistic: 'avg' }),
          evaluationPeriods: 3,
          threshold: 1,
          datapointsToAlarm: 3,
          comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
          treatMissingData: TreatMissingData.IGNORE,
        }));
      }

      this.alarms.push(new Alarm(infraStack, 'HighMemoryUtilization', {
        alarmDescription: 'The process is using more memory than expected',
        metric: this.alarmMetrics.memUsed.with({ statistic: 'avg' }),
        evaluationPeriods: 5,
        threshold: 65,
        comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: TreatMissingData.IGNORE,
      }));

      this.alarms.push(new Alarm(infraStack, 'HighDiskUtilization', {
        alarmDescription: 'High disk utilization found',
        metric: this.alarmMetrics.diskUsed.with({ statistic: 'avg' }),
        evaluationPeriods: 5,
        threshold: 70,
        comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: TreatMissingData.IGNORE,
      }));

      this.alarms
        .map((alarm) => new AlarmWidget({ alarm }))
        .forEach((widget) => alarmDashboard.addWidgets(widget));
    }
}
