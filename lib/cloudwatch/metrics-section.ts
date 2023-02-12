/* Copyright OpenSearch Contributors
SPDX-License-Identifier: Apache-2.0

The OpenSearch Contributors require contributions made to
this file be licensed under the Apache-2.0 license or a
compatible open source license. */

interface MetricDefinition {
    measurement: string[];
}

interface EditableCloudwatchMetricsSection {
    // eslint-disable-next-line camelcase
    metrics_collected: {
        cpu: MetricDefinition,
        disk: MetricDefinition,
        diskio: MetricDefinition,
        mem: MetricDefinition,
        net: MetricDefinition,
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
