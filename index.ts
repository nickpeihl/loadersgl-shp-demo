import {
  _BrowserFileSystem as BrowserFileSystem,
  loadInBatches,
} from "@loaders.gl/core";
import { ShapefileLoader } from "@loaders.gl/shapefile";
import * as dragDrop from "drag-drop";

async function convert(shapefiles: Map<string, Map<string, File>>) {
  for (const shapefile of shapefiles.values()) {
    if (!shapefile.has("shp")) {
      throw Error("Missing .shp file");
    }
    const fileSystem = new BrowserFileSystem(Array.from(shapefile.values()));
    const { fetch } = fileSystem;
    const batches = await loadInBatches(
      shapefile.get("shp").name,
      ShapefileLoader,
      {
        fetch,
        // Reproject shapefiles to WGS84
        gis: { reproject: true, _targetCrs: "EPSG:4326" },
        // Only parse the X & Y coordinates. Other coords not supported by Elasticsearch.
        shp: { _maxDimensions: 2 },
        // Don't log the metadata, only the geo data
        metadata: false,
      }
    );
    for await (const batch of batches) {
      console.log(batch);
    }
  }
}

dragDrop("#dropTarget", (files) => {
  var count = files.length;
  console.log("File Count: " + count + "\n");

  const REQUIRED_EXTENSIONS = ["shp", "shx", "dbf", "prj"];
  const shps = new Map();

  for (const file of files) {
    const pos = file.name.lastIndexOf(".");
    const ext = file.name.substring(pos + 1);
    const name = file.name.substring(0, pos);
    if (!REQUIRED_EXTENSIONS.includes(ext)) continue;
    if (shps.has(name)) {
      const shp = shps.get(name);
      shp.set(ext, file);
    } else {
      const shp = new Map();
      shp.set(ext, file);
      shps.set(name, shp);
    }
  }

  convert(shps);
});
