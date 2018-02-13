var commandExistsSync = require('command-exists').sync;
const { execSync } = require('child_process');
const request = require("request");
const PNG = require('pngjs').PNG;
const fs = require('fs');


if (!commandExistsSync('grib_set') || !commandExistsSync('grib_dump')) {

    console.log("grib_set and grib_dump binaries not found");

} else if(process.argv.length < 5) {

    console.log("Not enough parameters: time date \"[minLat,maxLat,minLon,maxLon]\"");

} else {

    doRequest(process.argv[2], process.argv[3], process.argv[4]);

}

function doRequest(time, date, bbox) {

    const bboxArray = JSON.parse(bbox);
    const url = buildURL(time, date, bboxArray);

    console.log(url);
    request.get({url: url, encoding: null}, (error, response, body) => {
        processResponse(body);
    });

}

function buildURL(time, date, bboxArray) {

    const minLat = parseFloat(bboxArray[0]);
    const maxLat = parseFloat(bboxArray[1]);
    const minLon = parseFloat(bboxArray[2]);
    const maxLon = parseFloat(bboxArray[3]);

    return `http://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?file=gfs.t${time}z.pgrb2.0p25.f000&lev_10_m_above_ground=on&leftlon=${minLon}&rightlon=${maxLon}&toplat=${maxLat}&bottomlat=${minLat}&dir=/gfs.${date}${time}`;

}

function processResponse(data) {

    fs.writeFileSync("tmp.grib", data);
    convertGrib2Json();
    createTexture();

}

function convertGrib2Json() {

    // Transform the grib file to grid_simple (https://software.ecmwf.int/wiki/display/GRIB/GRIB+API+keys)
    execSync("grib_set -r -s packingType=grid_simple tmp.grib tmp.simple.grib");
    execSync("grib_dump -j tmp.simple.grib > tmp.json");

}

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

function fillTexture(image, width, height, uData, vData) {

    const halfWidth = width / 2;
    for(let i = 0; i < height; i++) {
        
        for(let j = 0; j < width; j++) {

            const pngIndex = (i * width + j) * 4;
            const gribIndex = i * width + (j + halfWidth) % width; // Acount for the GRIB values offset (https://www.wmo.int/pages/prog/www/WDM/Guides/Guide-binary-2.html)
            image.data[pngIndex + 0] = normalizeValue(uData.values[gribIndex], uData.minimum, uData.maximum);
            image.data[pngIndex + 1] = normalizeValue(vData.values[gribIndex], vData.minimum, vData.maximum);
            image.data[pngIndex + 2] = 255;
            image.data[pngIndex + 3] = 255;

        }

    }

}

function normalizeValue(value, min, max) {

    return Math.floor(255 * (value - min) / (max - min));

}

function saveImage(image, name) {

    image.pack().pipe(fs.createWriteStream(name));

}

function saveMetadata(uData, vData, name) {

    fs.writeFileSync(name, JSON.stringify({
        uMin: uData.minimum,
        uMax: uData.maximum,
        vMin: vData.minimum,
        vMax: vData.maximum
    }, null, 2) + '\n');

}
