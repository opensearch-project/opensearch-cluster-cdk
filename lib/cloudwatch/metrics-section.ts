/* Copyright OpenSearch Contributors
SPDX-License-Identifier: Apache-2.0

The OpenSearch Contributors require contributions made to
this file be licensed under the Apache-2.0 license or a
compatible open source license. */

import { Unit } from 'aws-cdk-lib/aws-cloudwatch';

type MeasurementDefinition = string | { name: string, rename?: string, unit?: Unit }

interface MetricDefinition {
    resources?: string[],
    measurement: MeasurementDefinition[],
    // eslint-disable-next-line camelcase
    metrics_collection_interval?: number,
  }

export interface ProcstatMetricDefinition {
    pattern?: string;
    // eslint-disable-next-line camelcase
    append_dimensions?: string[];
    measurement: string[]; // procstat does not support the common measurement standard for rename/unit
    // eslint-disable-next-line camelcase
    metrics_collection_interval: number;
  }

interface EditableCloudwatchMetricsSection {
    // eslint-disable-next-line camelcase
    namespace?: string;
    // eslint-disable-next-line camelcase
    append_dimensions?: any;
    // eslint-disable-next-line camelcase
    aggregation_dimensions?: any;
    // eslint-disable-next-line camelcase
    metrics_collected: {
        procstat?: ProcstatMetricDefinition[],
        cpu?: MetricDefinition,
        disk?: MetricDefinition,
        diskio?: MetricDefinition,
        mem?: MetricDefinition,
        net?: MetricDefinition,
    };
}

/**
 * Cloudwatch configuration - Metrics Section
 *
 * See definition at https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Agent-Configuration-File-Details.html#CloudWatch-Agent-Configuration-File-Metricssection
 *
 * Example configuration:
 * ```
 * metrics: {
 *   metrics_collected: {
 *       "cpu": {
 *         "measurement": [
 *           "cpu_usage_idle",
 *           "cpu_usage_nice",
 *           "cpu_usage_guest",
 *         ],
 *       },
 *   }
 *   metrics_collection_interval: 60, // seconds between collections
 * }
 * ```
 */
export type CloudwatchMetricsSection = Readonly<EditableCloudwatchMetricsSection>;
