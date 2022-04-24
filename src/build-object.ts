import { debug } from "./util";
import {
  BuiltHeapValue,
  HeapSnapshot,
  HeapSnapshotStructuredGraph,
  HeapSnapshotStructuredEdge,
} from "./types";
import { createStructuredGraph } from "./structured-graph";

export function buildObjectFromNodeId(
  heapSnapshot: HeapSnapshot,
  nodeId: number,
  propertyFilter: (propertyName: string) => boolean = () => true
): BuiltHeapValue {
  debug(`building node object for node ${nodeId}`);

  const graph = createStructuredGraph(heapSnapshot, nodeId, {
    edgeFilter: (edge: HeapSnapshotStructuredEdge) => {
      if (edge.type === "property") {
        return edge.name! !== "__proto__" && propertyFilter(edge.name!);
      }

      return (
        edge.type === "element" ||
        edge.name === "value" ||
        edge.type === "hidden"
      );
    },
  });

  if (graph.node.type !== "object") {
    throw new Error(`Node '${nodeId}' is not object, cannot build object`);
  }

  debug(`compiling graph node object ${nodeId}`);
  return compileGraphNodeObject(graph);
}

function compileGraphNodeObject(
  graph: HeapSnapshotStructuredGraph
): BuiltHeapValue {
  const node = graph.node;
  const nodeType = node.type;
  const nodeName = node.name;

  const edges = graph.edges.filter(({ graph }) => {
    const edgeNodeType = graph?.node?.type;

    if (!edgeNodeType) {
      return false;
    }

    if (edgeNodeType === "object") {
      return ["Array", "Object"].includes(graph.node.name);
    } else {
      return (
        ["array", "string", "number", "regexp"].includes(edgeNodeType) ||
        isBoolean(graph) ||
        isNull(graph)
      );
    }
  });

  if (nodeType === "array") {
    return edges.map(({ graph: arrayValueGraph }) =>
      compileGraphNodeObject(arrayValueGraph!)
    );
  } else if (nodeType === "object") {
    if (nodeName === "Object") {
      return edges.reduce(
        (obj, { edge, graph }) => ({
          ...obj,
          [edge.name!]: compileGraphNodeObject(graph!),
        }),
        {}
      );
    } else if (nodeName === "Array") {
      return compileGraphNodeObject({
        ...graph,
        node: {
          ...graph.node,
          type: "array",
        },
      });
    } else {
      throw new Error(`Unknown or unsupported object with type '${nodeName}'`);
    }
  } else if (nodeType === "string") {
    return node.name;
  } else if (nodeType === "regexp") {
    return new RegExp(node.name as string);
  } else if (nodeType === "number") {
    return parseFloat(
      edges.find(({ edge }) => edge.name === "value")!.graph!.node!.name
    );
  } else if (isBoolean(graph)) {
    return (
      graph.edges.find(({ graph }) => graph.node.type === "string").graph.node
        .name === "true"
    );
  } else if (isNull(graph)) {
    return null;
  } else {
    throw new Error(
      `Unknown graph node type '${nodeType}', unable to compile graph object`
    );
  }
}

function isBoolean(graph: HeapSnapshotStructuredGraph): boolean {
  return (
    graph.node.type === "hidden" &&
    !!graph.edges.find(({ graph }) => graph.node.name === "boolean")
  );
}

function isNull(graph: HeapSnapshotStructuredGraph): boolean {
  return (
    graph.node.type === "hidden" &&
    !!graph.edges.find(({ graph }) => graph.node.name === "object") &&
    !!graph.edges.find(({ graph }) => graph.node.name === "null")
  );
}
