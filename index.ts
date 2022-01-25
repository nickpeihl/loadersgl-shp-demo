import {
  _BrowserFileSystem as BrowserFileSystem,
  load,
} from "@loaders.gl/core";
import { ShapefileLoader } from "@loaders.gl/shapefile";
import * as dragDrop from "drag-drop";

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

  for (const shp of shps.values()) {
    if (!shp.has("shp")) {
      throw Error("Missing .shp file");
    }
    const fileSystem = new BrowserFileSystem(Array.from(shp.values()));
    const { fetch } = fileSystem;
    load(shp.get("shp").name, ShapefileLoader, {
      fetch,
      gis: { reproject: true, _targetCrs: "EPSG:4326" },
      metadata: true,
    }).then((data) => console.log(data));
  }
});
