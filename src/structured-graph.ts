import {
  findEdgeById,
  findNodeById,
  getFieldValue,
  getNodeAtIndex,
  getNodeEdgeIds,
} from "./snapshot";
import {
  HeapSnapshot,
  HeapSnapshotStructuredEdge,
  HeapSnapshotStructuredGraph,
  HeapSnapshotStructuredNode,
} from "./types";

export function createStructuredGraph(
  heapSnapshot: HeapSnapshot,
  nodeId: number,
  structuredNode: HeapSnapshotStructuredNode,
  {
    maxDepth = Infinity,
    edgeFilter = () => true,
  }: {
    maxDepth?: number;
    edgeFilter?: (edge: HeapSnapshotStructuredEdge) => boolean;
  } = {},
  nodeIdStack: number[] = []
): HeapSnapshotStructuredGraph {
  const structuredEdges = structuredNode.edgeIds
    .map((edgeId) => createStructuredEdge(heapSnapshot, edgeId))
    .filter(edgeFilter);

  return {
    node: structuredNode,
    edges: structuredEdges.map((structuredEdge) => {
      const isCircular = nodeIdStack.includes(structuredEdge.nodeId);

      return {
        isCircular,
        edge: structuredEdge,
        graph:
          !isCircular && nodeIdStack.length < maxDepth
            ? createStructuredGraph(
                heapSnapshot,
                structuredEdge.nodeId,
                createStructuredNode(heapSnapshot, structuredEdge.nodeId),
                { maxDepth, edgeFilter },
                [...nodeIdStack, nodeId]
              )
            : null,
      };
    }),
  };
}

export function createStructuredNode(
  heapSnapshot: HeapSnapshot,
  nodeId: number
): HeapSnapshotStructuredNode {
  const { node, nodeIndex } = findNodeById(heapSnapshot, nodeId);
  const edgeIds = getNodeEdgeIds(heapSnapshot, nodeId);

  return {
    nodeIndex,
    edgeIds,
    edgeCount: getFieldValue(
      heapSnapshot,
      "node",
      "edge_count",
      node
    ) as number,
    type: getFieldValue(heapSnapshot, "node", "type", node) as string,
    name: getFieldValue(heapSnapshot, "node", "name", node) as string,
    id: getFieldValue(heapSnapshot, "node", "id", node) as number,
    size: getFieldValue(heapSnapshot, "node", "self_size", node) as number,
    traceNodeId: getFieldValue(
      heapSnapshot,
      "node",
      "trace_node_id",
      node
    ) as number,
    detachness: getFieldValue(
      heapSnapshot,
      "node",
      "detachedness",
      node
    ) as number,
  };
}

function createStructuredEdge(
  heapSnapshot: HeapSnapshot,
  edgeId: number
): HeapSnapshotStructuredEdge {
  const { edge } = findEdgeById(heapSnapshot, edgeId);
  const type = getFieldValue(heapSnapshot, "edge", "type", edge) as string;
  // to_node is the index of the first value of the node in the nodes array
  const nodeIndex =
    (getFieldValue(heapSnapshot, "edge", "to_node", edge) as number) /
    heapSnapshot.snapshot.meta.node_fields.length;
  const nodeId = getFieldValue(
    heapSnapshot,
    "node",
    "id",
    getNodeAtIndex(heapSnapshot, nodeIndex)
  ) as number;
  const isIndex = type === "element" || type === "hidden";
  const nameOrIndex = getFieldValue(
    heapSnapshot,
    "edge",
    "name_or_index",
    edge,
    !isIndex
  );

  return {
    id: edgeId,
    type,
    nodeId,
    name: !isIndex ? (nameOrIndex as string) : undefined,
    index: isIndex ? (nameOrIndex as number) : undefined,
  };
}

export function formatStructuredGraph(
  structuredGraph: HeapSnapshotStructuredGraph,
  indentSize = 0
): string {
  const lines = [];
  const indent = "   ".repeat(indentSize);
  const { node, edges } = structuredGraph;

  lines.push(
    indent +
      `Node{${node.id}} ${node.name} (type: ${node.type}, size: ${node.size})`
  );

  edges.forEach(({ edge, graph, isCircular }) => {
    lines.push(
      indent +
        `-> Edge{${edge.id}} ${edge.name || edge.index} (${
          edge.type
        }) -> Node{${edge.nodeId}}` +
        (isCircular ? " (circular)" : "")
    );

    if (graph) {
      lines.push(formatStructuredGraph(graph, indentSize + 1));
    }
  });

  return lines.join("\n");
}
