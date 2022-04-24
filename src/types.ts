export type HeapSnapshotNode = Uint32Array;
export type HeapSnapshotEdge = Uint32Array;

export type HeapSnapshotStructuredEdge = {
  id: number;
  type: string;
  name?: string;
  index?: number;
  nodeId: number;
};

export type HeapSnapshotStructuredNode = {
  id: number;
  nodeIndex: number;
  type: string;
  name: string;
  size: number;
  edgeCount: number;
  traceNodeId: number;
  detachness: number;
  edgeIds: number[];
};

export type HeapSnapshotStructuredGraph = {
  node: HeapSnapshotStructuredNode;
  edges: {
    isCircular: boolean;
    edge: HeapSnapshotStructuredEdge;
    graph: HeapSnapshotStructuredGraph | null;
  }[];
};

export type MetaValue = string | string[];
export type SerializedHeapSnapshot = {
  snapshot: {
    node_count: number;
    edge_count: number;
    trace_function_count: number;

    meta: {
      node_fields: MetaValue[];
      node_types: MetaValue[];
      edge_fields: MetaValue[];
      edge_types: MetaValue[];
      trace_function_info_fields: MetaValue[];
      trace_node_fields: MetaValue[];
      sample_fields: MetaValue[];
      location_fields: MetaValue[];
    };
  };

  nodes: number[];
  edges: number[];
  strings: string[];

  trace_function_infos: number[];
  samples: number[];
  trace_tree: number[];
  locations: number[];
};

export type HeapSnapshot = Omit<SerializedHeapSnapshot, "nodes" | "edges"> & {
  edges: Uint32Array;
  nodes: Uint32Array;
};

export type BuiltHeapValue =
  | undefined
  | string
  | number
  | RegExp
  | boolean
  | BuiltHeapValue[]
  | {
      [key: string]: BuiltHeapValue;
    };
