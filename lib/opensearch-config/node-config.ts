/* Copyright OpenSearch Contributors
SPDX-License-Identifier: Apache-2.0

The OpenSearch Contributors require contributions made to
this file be licensed under the Apache-2.0 license or a
compatible open source license. */

export const nodeConfig = new Map<string, object>();

nodeConfig.set('manager', {
  'node.roles': [ 'cluster_manager' ]
});

nodeConfig.set('data', {
  'node.roles': [ 'data', 'ingest' ]
});

nodeConfig.set('seed-manager', {
  'node.name': 'seed',
  'node.roles': [ 'cluster_manager' ]
});

nodeConfig.set('seed-data', {
  'node.name': 'seed',
  'node.roles': [ 'cluster_manager', 'data' ]
});

nodeConfig.set('client', {
  'node.name': 'client-node',
  'node.roles': []
});

nodeConfig.set('ml', {
  'node.name': 'ml-node',
  'node.roles': ['ml'],
});
