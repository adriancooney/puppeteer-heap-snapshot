# Puppeteer Heap Snapshot
Capture heap snapshots and query the snapshot for objects matching a set of properties. Read more about it in [this blog post](https://www.adriancooney.ie/blog/web-scraping-via-javascript-heap-snapshots).

### Install
Install via npm/yarn.

```
$ npm install puppeteer-heap-snapshot
```

### API
#### `captureHeapSnapshot(target: Puppeteer.Target): HeapSnapshot`

Capture a heap snapshot from a Puppeteer page target (obtained via `await page.target()`). Warning: this data structure can grow very large (1mb - 250mb or more) so be sure you have enough memory available.

Example:

```js
const browser = await Puppeteer.launch();
const page = await browser.newPage();

await page.goTo("https://google.com")

const heapSnapshot = await captureHeapSnapshot(await page.target());
```

#### `findObjectsWithProperties(heapSnapshot: HeapSnapshot, properties: string[], options?: { ignoreProperties?: string[] }): BuiltHeapValue[]`

Find objects in the heap snapshot that include a set of properties. This operation is computationally expensive traversing the large heap snapshot graph and may be slow. To improve performance, you can specify a list of properties in `ignoreProperties` to skip traversing and serialization. These properties will not be present on the result.

```js
const objects = findObjectsWithProperties(heapSnapshot, ["foo", "bar"]);

// objects = [{
//   "foo": true,
//   "bar": false,
//   "baz": "lorem ipsum"
// }]
```

Warning: this code is not optimized and may be slow if many objects match your query and/or the matching objects are large.

#### `findObjectWithProperties(heapSnapshot: HeapSnapshot, properties: string[], options?: { ignoreProperties?: string[] }): BuiltHeapValue[]`

Identical to `findObjectsWithProperties` except it throws an error if no object found or more than one object found.

### CLI
This package comes with a small CLI that allows you to fetch heap snapshots for URLs and run queries on them.

```sh
$ npx puppeteer-heap-snapshot --help
Usage: puppeteer-heap-snapshot [options] [command]

Options:
  --debug               Enable debug mode (non-headless Chrome, debug logging)
  --no-headless         Do not run Chrome in headless mode
  -w, --wait <timeout>  Add a wait time before taking a heap snapshot (default: "10000")
  -h, --help            display help for command

Commands:
  fetch [options]       fetch a heap snapshot for a URL and write to a file
  query [options]       fetch/read a heap snapshot and output the matching objects in JSON
  help [command]        display help for command
```

For example, fetch from a URL and output matching objects:

```sh
$ npx puppeteer-heap-snapshot query -u https://www.instagram.com/p/CVEJmFTgdRw/ -p video_view_count,video_play_count,shortcode,video_url --no-headless | jq .
>> Opening Puppeteer page at: https://www.instagram.com/p/CVEJmFTgdRw/
>> Taking heap snapshot..
[
  {
    "__typename": "GraphVideo",
    "id": "2685313477274358896",
    "shortcode": "CVEJmFTgdRw",
    "dimensions": {
      "height": 1138,
      "width": 640
    },
    "has_audio": true,
    "video_url": "https://scontent-dub4-1.cdninstagram.com/v/t50.2886-16/245967496_255835479890012_5087347215509320349_n.mp4?efg=eyJ2ZW5jb2RlX3RhZyI6InZ0c192b2RfdXJsZ2VuLjY0MC5jbGlwcy5iYXNlbGluZSIsInFlX2dyb3VwcyI6IltcImlnX3dlYl9kZWxpdmVyeV92dHNfb3RmXCJdIn0&_nc_ht=scontent-dub4-1.cdninstagram.com&_nc_cat=108&_nc_ohc=rWf9nUMf15MAX-SnjOC&edm=AABBvjUBAAAA&vs=1007318140116355_4062183883&_nc_vs=HBksFQAYJEdJZ3FxUTVjV09aV3J1Z0FBSjF5Z2ExVzQ1bEdicV9FQUFBRhUAAsgBABUAGCRHSnZtbmc0SUxSVkZlNDBLQU54WGpxeTVyR2M4YnFfRUFBQUYVAgLIAQAoABgAGwAVAAAm6q%2FRme3ItUAVAigCQzMsF0A35mZmZmZmGBJkYXNoX2Jhc2VsaW5lXzFfdjERAHX%2BBwA%3D&ccb=7-4&oe=626815EC&oh=00_AT_n_BkYsvtICC3t_C2HlRaILWv4xsqZAjcZKcRoR36fng&_nc_sid=83d603",
    "video_view_count": 1728940,
    "video_play_count": 3612084,
    "is_video": true,
    "tracking_token": "eyJ2ZXJzaW9uIjo1LCJwYXlsb2FkIjp7ImlzX2FuYWx5dGljc190cmFja2VkIjp0cnVlLCJ1dWlkIjoiYjNmNGRlYjAxMzk1NGZhM2FmNmQ1OWY1YTUwYzEzZmEyNjg1MzEzNDc3Mjc0MzU4ODk2In0sInNpZ25hdHVyZSI6IiJ9",
    "upcoming_event": null,
    "edge_media_to_tagged_user": {
      "edges": []
    },
    "edge_media_to_caption": {
      "edges": [
        {
          "node": {
            "created_at": "1634334356",
            "text": "You can feel the pain through that facial expression! 梁\n @jago.artist\nRome, Italy"
          }
        }
      ]
    },
    "can_see_insights_as_brand": false,
    "caption_is_edited": false,
    "has_ranked_comments": false,
    "like_and_view_counts_disabled": false,
    "comments_disabled": false,
    "commenting_disabled_for_viewer": false,
    "taken_at_timestamp": 1634334355,
    "edge_media_preview_like": {
      "count": 166233,
      "edges": []
    },
    "edge_media_to_sponsor_user": {
      "edges": []
    },
    "is_affiliate": false,
    "is_paid_partnership": false,
    "location": null,
    "nft_asset_info": null,
    "viewer_has_liked": false,
    "viewer_has_saved": false,
    "viewer_has_saved_to_collection": false,
    "viewer_in_photo_of_you": false,
    "viewer_can_reshare": true,
    "owner": {
      "id": "303273692",
      "is_verified": false,
      "profile_pic_url": "https://scontent-dub4-1.cdninstagram.com/v/t51.2885-19/277325903_668349461072817_8676852949764101515_n.jpg?stp=dst-jpg_s150x150&_nc_ht=scontent-dub4-1.cdninstagram.com&_nc_cat=1&_nc_ohc=kh9ga1KrRAMAX9grvVd&edm=AABBvjUBAAAA&ccb=7-4&oh=00_AT_cEiCoW8MI44lLvf9UAyzlx0oFE2nOBKb1fz5egVb36g&oe=626CCED0&_nc_sid=83d603",
      "username": "earthpix",
      "blocked_by_viewer": false,
      "restricted_by_viewer": null,
      "followed_by_viewer": false,
      "full_name": "  EarthPix  ",
      "has_blocked_viewer": false,
      "is_embeds_disabled": false,
      "is_private": false,
      "is_unpublished": false,
      "requested_by_viewer": false,
      "pass_tiering_recommendation": true,
      "edge_owner_to_timeline_media": {
        "count": 8690
      },
      "edge_followed_by": {
        "count": 23020451
      }
    },
    "is_ad": false,
    "coauthor_producers": [],
    "pinned_for_users": [],
    "encoding_status": null,
    "is_published": true,
    "product_type": "clips",
    "title": "",
    "video_duration": 23.9,
    "thumbnail_src": "https://scontent-dub4-1.cdninstagram.com/v/t51.2885-15/245961614_4361781063908112_409992614002041515_n.jpg?stp=c0.249.640.640a_dst-jpg_e35&_nc_ht=scontent-dub4-1.cdninstagram.com&_nc_cat=100&_nc_ohc=n88eii2iM2gAX_UthWA&edm=AABBvjUBAAAA&ccb=7-4&oh=00_AT84-O-4_gUIoKKa2IfsGy4eiw3jCbO09oi4rLA5P_1Nvw&oe=6267DE3F&_nc_sid=83d603",
    // ... <snip>
  }
]

