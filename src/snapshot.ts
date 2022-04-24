import { debug } from "./util";
import { HeapSnapshot, HeapSnapshotEdge, HeapSnapshotNode } from "./types";

const COMMON_PROPERTIES = ["name"];

function getString(heapSnapshot: HeapSnapshot, stringId: number): string {
  return heapSnapshot.strings[stringId];
}

export function getNodeEdgeIds(
  heapSnapshot: HeapSnapshot,
  nodeId: number
): number[] {
  const { node, nodeIndex } = findNodeById(heapSnapshot, nodeId);

  let edgeOffset = 0;

  for (let i = 0; i < nodeIndex; i++) {
    edgeOffset += getNodeEdgeCount(
      heapSnapshot,
      getNodeAtIndex(heapSnapshot, i)
    );
  }

  const edgeCount = getNodeEdgeCount(heapSnapshot, node);

  return Array(edgeCount)
    .fill(0)
    .map((_, i) => {
      return edgeOffset + i;
    });
}

export function findEdgeParentNodeId(
  heapSnapshot: HeapSnapshot,
  edgeId: number
): number {
  let edgeIdOffset = 0;

  for (let i = 0; i < heapSnapshot.snapshot.node_count; i++) {
    edgeIdOffset += getNodeEdgeCount(
      heapSnapshot,
      getNodeAtIndex(heapSnapshot, i)
    );

    if (edgeIdOffset > edgeId) {
      return getFieldValue(
        heapSnapshot,
        "node",
        "id",
        getNodeAtIndex(heapSnapshot, i)
      ) as number;
    }
  }

  throw new Error(`Unable to find parent node for edge '${edgeId}'`);
}

export function getNodeEdgeCount(
  heapSnapshot: HeapSnapshot,
  node: HeapSnapshotNode
): number {
  return getFieldValue(heapSnapshot, "node", "edge_count", node) as number;
}

export function findEdgeById(
  heapSnapshot: HeapSnapshot,
  edgeId: number
): { edge: HeapSnapshotEdge; edgeIndex: number } {
  const edge = getEdgeAtIndex(heapSnapshot, edgeId);

  if (!edge) {
    throw new Error(`Unable to find edge with id '${edgeId}'`);
  }

  return {
    edge,
    edgeIndex: edgeId,
  };
}

export function getEdgeAtIndex(
  heapSnapshot: HeapSnapshot,
  edgeIndex: number
): HeapSnapshotEdge {
  const edgeSize = heapSnapshot.snapshot.meta.edge_fields.length;
  const edgeOffset = edgeIndex * edgeSize;
  return heapSnapshot.edges.slice(edgeOffset, edgeOffset + edgeSize);
}

export function getFieldValue(
  heapSnapshot: HeapSnapshot,
  fieldSource: "edge" | "node",
  fieldName: string,
  value: Uint32Array,
  stringOrNumberIsString = false
): string | number {
  const fields = heapSnapshot.snapshot.meta[`${fieldSource}_fields`];
  const fieldIndex = fields.indexOf(fieldName);

  if (fieldIndex === -1) {
    throw new Error(`Unknown node field: ${fieldName}`);
  }

  const fieldTypes = heapSnapshot.snapshot.meta[`${fieldSource}_types`];
  const fieldType = fieldTypes[fieldIndex];
  const fieldRawValue = value[fieldIndex];

  let fieldValue!: string | number;

  if (Array.isArray(fieldType)) {
    fieldValue = fieldType[fieldRawValue] as string;
  } else if (fieldType === "string") {
    fieldValue = getString(heapSnapshot, fieldRawValue);
  } else if (fieldType === "number") {
    fieldValue = fieldRawValue;
  } else if (fieldType === "string_or_number") {
    fieldValue = stringOrNumberIsString
      ? getString(heapSnapshot, fieldRawValue)
      : fieldRawValue;
  } else if (fieldType === "node") {
    fieldValue = fieldRawValue;
  } else {
    throw new Error(`Unknown field type '${fieldType}'`);
  }

  if (typeof fieldValue === "undefined") {
    throw new Error(
      `Undefined returned for field value with {fieldName: ${fieldName}, fieldType: ${fieldType}, fieldRawValue: ${fieldRawValue}, fieldSource: ${fieldSource}, fieldIndex: ${fieldIndex}, fields: ${fields.join(
        ","
      )}, value: ${value.join(",")}}`
    );
  }

  return fieldValue;
}

export function filterEdgeIds(
  heapSnapshot: HeapSnapshot,
  iterator: (node: HeapSnapshotEdge, edgeId: number) => boolean
): number[] {
  const edgeIds: number[] = [];

  iterateEdges(heapSnapshot, (edge, edgeId) => {
    if (iterator(edge, edgeId)) {
      edgeIds.push(edgeId);
    }
  });

  return edgeIds;
}

export function iterateEdges(
  heapSnapshot: HeapSnapshot,
  iterator: (node: HeapSnapshotEdge, edgeId: number) => void | false
) {
  for (let edgeId = 0; edgeId < heapSnapshot.snapshot.edge_count; edgeId++) {
    const value = iterator(getEdgeAtIndex(heapSnapshot, edgeId), edgeId);

    if (value === false) {
      break;
    }
  }
}

export function iterateNodes(
  heapSnapshot: HeapSnapshot,
  iterator: (node: HeapSnapshotNode, nodeIndex: number) => void | false
) {
  for (
    let nodeIndex = 0;
    nodeIndex < heapSnapshot.snapshot.node_count;
    nodeIndex++
  ) {
    const value = iterator(getNodeAtIndex(heapSnapshot, nodeIndex), nodeIndex);

    if (value === false) {
      break;
    }
  }
}

export function findNodeById(
  heapSnapshot: HeapSnapshot,
  nodeId: number
): { node: HeapSnapshotNode; nodeIndex: number } {
  let node: HeapSnapshotNode | null = null;
  let nodeIndex: number | null = null;

  iterateNodes(heapSnapshot, (currentNode, currentNodeIndex) => {
    if (
      (getFieldValue(heapSnapshot, "node", "id", currentNode) as number) ===
      nodeId
    ) {
      node = currentNode;
      nodeIndex = currentNodeIndex;

      return false;
    }
  });

  if (node) {
    return {
      node,
      nodeIndex: nodeIndex!,
    };
  } else {
    throw new Error(`Unable to find node with id '${nodeId}'`);
  }
}

export function getNodeAtIndex(
  heapSnapshot: HeapSnapshot,
  index: number
): HeapSnapshotNode {
  if (index > heapSnapshot.snapshot.node_count) {
    throw new Error(
      `Attempting index node that is out of bounds of snapshot (index: ${index}, total node count: ${heapSnapshot.snapshot.node_count})`
    );
  }

  const nodeSize = heapSnapshot.snapshot.meta.node_fields.length;
  const nodeOffset = index * nodeSize;

  return heapSnapshot.nodes.slice(nodeOffset, nodeOffset + nodeSize);
}

export function findNodeIdsWithProperties(
  heapSnapshot: HeapSnapshot,
  propertyNames: readonly string[]
): number[] {
  if (!propertyNames.length) {
    throw new Error(
      `Please specify at least one property to find node ids for`
    );
  }

  return propertyNames.reduce<number[] | null>(
    (commonProperties, propertyName) => {
      if (commonProperties === null) {
        return findNodeIdsWithProperty(heapSnapshot, propertyName);
      }

      if (commonProperties.length === 0) {
        return [];
      }

      debug(`${commonProperties.length} common nodes`);
      return intersection(
        commonProperties,
        findNodeIdsWithProperty(heapSnapshot, propertyName)
      );
    },
    null
  )!;
}

function findNodeIdsWithProperty(
  heapSnapshot: HeapSnapshot,
  propertyName: string
): number[] {
  if (COMMON_PROPERTIES.includes(propertyName)) {
    debug(`property '${propertyName}' is part of many objects and may be slow`);
  }

  const edgeIds = findPropertyEdgeIdsForString(heapSnapshot, propertyName);

  debug(`${edgeIds.length} nodes found with property`, propertyName);

  return edgeIds.map((edgeId) => findEdgeParentNodeId(heapSnapshot, edgeId));
}

function findPropertyEdgeIdsForString(
  heapSnapshot: HeapSnapshot,
  str: string
): number[] {
  debug(`finding property edges for string`, str);
  return filterEdgeIds(heapSnapshot, (edge) => {
    const edgeType = getFieldValue(
      heapSnapshot,
      "edge",
      "type",
      edge
    ) as string;

    if (edgeType !== "property") {
      return false;
    }

    const edgeName = getFieldValue(
      heapSnapshot,
      "edge",
      "name_or_index",
      edge,
      true
    ) as string;

    return edgeName === str;
  });
}

function intersection<T>(a: T[], b: T[]): T[] {
  return a.filter((v) => b.includes(v));
}
