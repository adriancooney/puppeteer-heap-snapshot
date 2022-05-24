import { debug } from "./util";
import { BuiltHeapValue, HeapSnapshot } from "./types";
import { findNodeIdsWithProperties } from "./snapshot";
import { buildObjectFromNodeId } from "./build-object";

type FindObjectOptions = {
  ignoreProperties?: readonly string[];
  maxDepth?: number;
  unwantedNodeNames?: readonly string[];
};

type FindObjectReturnValue<
  Props extends readonly string[],
  Options extends FindObjectOptions
> = {
  [key in Exclude<Props[number], Options["ignoreProperties"]>]: BuiltHeapValue;
};

export function findObjectsWithProperties<
  Props extends readonly string[],
  Options extends FindObjectOptions
>(
  heapSnapshot: HeapSnapshot,
  properties: Props,
  options?: Options
): FindObjectReturnValue<Props, Options>[] {
  debug("finding objects with properties", properties, options);

  const nodeIds = findNodeIdsWithProperties(heapSnapshot, properties);

  debug(`${nodeIds.length} nodes found, compiling objects`);

  if (nodeIds.length > 5) {
    debug(
      `more than 5 nodes found, this may be slow - to improve performance, increase the specifity of your query or ignore unwanted properties on the target object`
    );
  }

  return nodeIds
    .map((nodeId) => {
      debug(`node ${nodeId} found`);
      return buildObjectFromNodeId(heapSnapshot, nodeId, {
        ...options,
        propertyFilter: options?.ignoreProperties
          ? (prop) => !options.ignoreProperties!.includes(prop)
          : undefined,
      });
    })
    .filter((v) => v !== undefined) as FindObjectReturnValue<Props, Options>[];
}

export function findObjectWithProperties<
  Props extends readonly string[],
  Options extends FindObjectOptions
>(
  heapSnapshot: HeapSnapshot,
  properties: Props,
  options?: Options
): FindObjectReturnValue<Props, Options> {
  const objects = findObjectsWithProperties<Props, Options>(
    heapSnapshot,
    properties,
    options
  );

  if (!objects.length) {
    throw new Error(
      `No object found with properties: ${properties.join(", ")}`
    );
  }

  if (objects.length > 1) {
    throw new Error(
      `More than one object found with properties: ${properties.join(", ")}`
    );
  }

  return objects[0]!;
}
