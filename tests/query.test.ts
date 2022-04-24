import { BuiltHeapValue, HeapSnapshot } from "../src";
import { readHeapSnapshot } from "../src/fs";
import {
  findObjectsWithProperties,
  findObjectWithProperties,
} from "../src/query";

describe("query", () => {
  let heapSnapshot: HeapSnapshot;

  beforeAll(async () => {
    heapSnapshot = await readHeapSnapshot(
      __dirname + "/fixtures/data/example.heapsnapshot"
    );
  });

  describe("findObjectsWithProperties", () => {
    it("finds all objects", async () => {
      expect(
        sortObjects(
          findObjectsWithProperties(heapSnapshot, ["bar", "id"] as const)
        )
      ).toMatchInlineSnapshot(`
        Array [
          Object {
            "bar": 2,
            "foo": 1,
            "id": "my-object-1",
          },
          Object {
            "bar": 1,
            "boot": 2,
            "id": "my-object-2",
          },
        ]
      `);
    });

    it("finds some objects", async () => {
      expect(findObjectsWithProperties(heapSnapshot, ["foo"]))
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "bar": 2,
            "foo": 1,
            "id": "my-object-1",
          },
          Object {
            "foo": Object {},
          },
        ]
      `);
    });

    it("finds some objects with more specific properties", async () => {
      expect(findObjectsWithProperties(heapSnapshot, ["bar", "boot"]))
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "bar": 1,
            "boot": 2,
            "id": "my-object-2",
          },
        ]
      `);
    });

    it("finds no objects", async () => {
      expect(
        findObjectsWithProperties(heapSnapshot, ["foo", "boot"])
      ).toMatchInlineSnapshot(`Array []`);
    });

    it("ignores propertoes", async () => {
      expect(
        findObjectsWithProperties(heapSnapshot, ["bar"], {
          ignoreProperties: ["foo"],
        })
      ).toMatchInlineSnapshot(`
        Array [
          Object {
            "bar": 1,
            "boot": 2,
            "id": "my-object-2",
          },
          Object {
            "bar": 2,
            "id": "my-object-1",
          },
        ]
      `);
    });

    it("parses complex objects", async () => {
      expect(findObjectsWithProperties(heapSnapshot, ["myComplexObject"]))
        .toMatchInlineSnapshot(`
        Array [
          Object {
            "b": null,
            "c": true,
            "circularRef": Object {
              "foo": Object {},
            },
            "d": Infinity,
            "g": Object {
              "a": 1,
              "b": 2,
              "c": Object {
                "a": 1,
                "b": 2,
              },
            },
            "h": 0.1,
            "i": 1e-12,
            "j": "foobar",
            "k": /foo\\.\\*b\\[\\^"\\]\\+a\\(r\\)\\?/,
            "myComplexObject": 1,
          },
        ]
      `);
    });
  });

  describe("findObjectWithProperties", () => {
    it("finds a single object", () => {
      expect(findObjectWithProperties(heapSnapshot, ["bar", "boot"]))
        .toMatchInlineSnapshot(`
        Object {
          "bar": 1,
          "boot": 2,
          "id": "my-object-2",
        }
      `);
    });

    it("throws if no object is found", () => {
      expect(() =>
        findObjectWithProperties(heapSnapshot, ["foo", "boot"])
      ).toThrowErrorMatchingInlineSnapshot(
        `"No object found with properties: foo, boot"`
      );
    });

    it("throws if more than one object found", () => {
      expect(() =>
        findObjectWithProperties(heapSnapshot, ["bar"])
      ).toThrowErrorMatchingInlineSnapshot(
        `"More than one object found with properties: bar"`
      );
    });
  });
});

function sortObjects<T>(objects: (T & { id: BuiltHeapValue })[]): T[] {
  return objects.sort((a, b) => (a.id as string).localeCompare(b.id as string));
}
