// @flow

const commandExistsSync = require("command-exists").sync;
const { execSync } = require("child_process");
const request = require("request");
const PNG = require("pngjs").PNG;
const fs = require("fs");


if (!commandExistsSync("grib_set") || !commandExistsSync("grib_dump")) {

    console.log("grib_set and grib_dump binaries not found");

} else if (process.argv.length < 5) {

    console.log("Not enough parameters: time date \"[minLat,maxLat" +
        ",minLon,maxLon]\"");

} else {

    const bbox = "[-90,90,0,360]";
    if (process.argv.length === 5) {

        bbox = process.argv[4];

    }

    doRequest(process.argv[2], process.argv[3], bbox);

}

/**
 * Does a request to get the wind data inside the bbox during a
 * time and data
 *
 * @param {string} time One of 00, 06, 12, 18
 * @param {string} date The date in YYYYMMDD format
 * @param {string} bbox A bbox in the format [minLat,maxLat,minLon,maxLon]
 * @example
 * doRequest("00", "20180214", "[-90,90,0,360]")
 */
function doRequest(time, date, bbox) {

    const bboxArray = JSON.parse(bbox);
    const url = buildURL(time, date, bboxArray);

    console.log(url);
    request.get({ 
        
        url: url, encoding: null 
    
    }, (error, response, body) => {

        processResponse(body);
        
    });

}

/**
 * Builds the request URL
 *
 * @param {string} time One of 00, 06, 12, 18
 * @param {string} date The date in YYYYMMDD format
 * @param {Array<number>} bboxArray A bbox in the format [minLat,maxLat,minLon,maxLon]
 * @example
 * buildURL("00", "20180214", [-90,90,0,360])
 */
function buildURL(time, date, bboxArray) {

    const minLat = parseFloat(bboxArray[0]);
    const maxLat = parseFloat(bboxArray[1]);
    const minLon = parseFloat(bboxArray[2]);
    const maxLon = parseFloat(bboxArray[3]);

    return `http://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t${time}z.pgrb2.0p25.f000&lev_10_m_above_ground=on&leftlon=${minLon}&rightlon=${maxLon}&toplat=${maxLat}&bottomlat=${minLat}&dir=/gfs.${date}${time}`;

}

/**
 * Processes the response data
 *
 * @param {string} data The data from the request
 * @example
 * processResponse(data)
 */
function processResponse(data) {

    fs.writeFileSync("tmp.grib", data);
    convertGrib2Json();
    createTexture();

}

/**
 * Sets the grib encoding to a grid_simple packing type 
 * (https://software.ecmwf.int/wiki/display/GRIB/GRIB+API+keys) 
 * and exports it as a JSON file
 *
 * @example
 * convertGrib2Json()
 */
function convertGrib2Json() {

    execSync("grib_set -r -s packingType=grid_simple tmp.grib tmp.simple.grib");
    execSync("grib_dump -j tmp.simple.grib > tmp.json");

}

/**
 * Encodes the grib data into the rg channels of a PNG image
 *
 * @example
 * createTexture()
 */
function createTexture() {

    const mergedData = fs.readFileSync("tmp.json", { encoding:"UTF-8" });
    const separatorPosition = mergedData.indexOf("}");
    const uDataString = mergedData.substring(0, separatorPosition+1);
    const vDataString = mergedData.substring(separatorPosition+1);
    const uData = JSON.parse(uDataString);
    const vData = JSON.parse(vDataString);

    const width = uData.Ni;
    const height = uData.Nj - 1;

    const image = new PNG({
        width: width,
        height: height,
        filterType: 4,
        colorType: 2    //Color, no alpha
    });

    fillTexture(image, width, height, uData, vData);
    saveImage(image, `${uData.dataDate}_${uData.dataTime}.png`)
    saveMetadata(uData, vData, `${uData.dataDate}_${uData.dataTime}.json`);

}

/**
 * Sets the pixel data to an image
 * @param {PNG} image The image where the data must be set
 * @param {number} width The image width
 * @param {number} height The image width
 * @param {Object} uData The u-component of the wind data
 * @param {Object} vData The v-component of the wind data
 *
 * @example
 * fillTexture(image, width, height, uData, vData)
 */
function fillTexture(image, width, height, uData, vData) {

    const halfWidth = width / 2;
    for(let i = 0; i < height; i++) {
        
        for(let j = 0; j < width; j++) {

            const pngIndex = (i * width + j) * 4;
            const gribIndex = i * width + (j + halfWidth) % width; // Offset the map to the 180th meridian so it shows a full map centered at europe
            image.data[pngIndex + 0] = normalizeValue(uData.values[gribIndex], uData.minimum, uData.maximum);
            image.data[pngIndex + 1] = normalizeValue(vData.values[gribIndex], vData.minimum, vData.maximum);
            image.data[pngIndex + 2] = 255;
            image.data[pngIndex + 3] = 255;

        }

    }

}

/**
 * Normalizes a value to the [0,256) interval
 * @param {number} value The value to normalize
 * @param {number} min The minimum range value
 * @param {number} max The maximum range value
 *
 * @example
 * normalizeValue(value, min, max)
 */
function normalizeValue(value, min, max) {

    return Math.floor(255 * (value - min) / (max - min));

}

/**
 * Saves the image data to a file with the given a name
 * @param {PNG} image The image data
 * @param {string} name The name of the file
 *
 * @example
 * saveImage(image, name)
 */
function saveImage(image, name) {

    image.pack().pipe(fs.createWriteStream(name));

}

/**
 * Saves a JSON file with some metadata
 * @param {Object} uData The u-component of the wind data
 * @param {Object} vData The v-component of the wind data
 * @param {string} name The name of the file
 *
 * @example
 * saveMetadata(uData, vData, name)
 */
function saveMetadata(uData, vData, name) {

    fs.writeFileSync(name, JSON.stringify({
        uMin: uData.minimum,
        uMax: uData.maximum,
        vMin: vData.minimum,
        vMax: vData.maximum
    }, null, 2) + "\n");

}
