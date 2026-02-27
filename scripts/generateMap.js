import fs from 'fs';
import * as topojson from 'topojson-client';
import { geoConicConformal, geoPath } from 'd3-geo';

const worldData = JSON.parse(fs.readFileSync('./node_modules/world-atlas/countries-110m.json', 'utf8'));
const countries = topojson.feature(worldData, worldData.objects.countries).features;
const russia = countries.find(c => c.id === '114' || c.id === '643' || c.properties?.name === 'Russia');

if (!russia) {
    console.error("Russia not found", countries.slice(0, 2).map(c => c.id));
    process.exit(1);
}

const projection = geoConicConformal()
    .rotate([-100, 0])
    .center([0, 65])
    .parallels([52, 64])
    .fitSize([100, 100], russia);

const pathGenerator = geoPath().projection(projection);
let svgPath = pathGenerator(russia);

fs.writeFileSync('./russia_path.txt', svgPath);
console.log("Success! Length:", svgPath.length);
