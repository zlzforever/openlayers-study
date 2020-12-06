import EsriJSON from 'ol/format/EsriJSON.js';
import Map from 'ol/Map.js';
import VectorSource from 'ol/source/Vector.js';
import View from 'ol/View.js';
import XYZ from 'ol/source/XYZ.js';
import { Fill, Stroke, Style } from 'ol/style.js';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js';
import { createXYZ } from 'ol/tilegrid.js';
import { fromLonLat } from 'ol/proj.js';
import { tile as tileStrategy } from 'ol/loadingstrategy.js';
import WMTS from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { getTopLeft, getWidth } from 'ol/extent';
import { get as getProjection } from 'ol/proj';
import Select from 'ol/interaction/Select.js';
import $ from 'jquery'

var projection = getProjection('EPSG:4326');//设置坐标系
var projectionExtent = projection.getExtent();
//分辨率
var resolutions = [
  1.40625,
  0.703125,
  0.3515625,
  0.17578125,
  0.087890625,
  0.0439453125,
  0.02197265625,
  0.010986328125,
  0.0054931640625,
  0.00274658203125,
  0.001373291015625,
  0.0006866455078125,
  0.00034332275390625,
  0.000171661376953125,
  0.0000858306884765625,
  0.00004291534423828125,
  0.000021457672119140625,
  0.000010728836059570312,
  0.000005364418029785156,
  0.000002682209014892578,
  0.000001341104507446289
];
//瓦片矩阵
var matrixIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

const serviceUrl =
  'http://47.101.205.209:8080/server/rest/services/ZHH_FUJIAN_GNFQ/FeatureServer/';
const layer = '0';

const esrijsonFormat = new EsriJSON();

const styleCache = {
  'ABANDONED': new Style({
    fill: new Fill({
      color: 'rgba(225, 225, 225, 255)',
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 255)',
      width: 0.4,
    }),
  }),
  'GAS': new Style({
    fill: new Fill({
      color: 'rgba(255, 0, 0, 255)',
    }),
    stroke: new Stroke({
      color: 'rgba(110, 110, 110, 255)',
      width: 0.4,
    }),
  }),
  'OIL': new Style({
    fill: new Fill({
      color: 'rgba(56, 168, 0, 255)',
    }),
    stroke: new Stroke({
      color: 'rgba(110, 110, 110, 255)',
      width: 0,
    }),
  }),
  'OILGAS': new Style({
    fill: new Fill({
      color: 'rgba(168, 112, 0, 255)',
    }),
    stroke: new Stroke({
      color: 'rgba(110, 110, 110, 255)',
      width: 0.4,
    }),
  }),
};

const vectorSource = new VectorSource({
  //http://47.101.205.209:8080/server/rest/services/ZHH_FUJIAN_GNFQ/FeatureServer/0/query?
  //f=json&returnGeometry=true&spatialRel=esriSpatialRelIntersects
  //&geometry={"xmin":13315941.823461544,"ymin":2998777.493705552,"xmax":13320833.793271787,"ymax":3003669.463515796,"spatialReference":{"wkid":102100,"latestWkid":3857}}
  //&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100
  loader: function (extent, resolution, projection) {
    const url =
      serviceUrl +
      layer +
      '/query/?f=json&' +
      'returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry=' +
      encodeURIComponent(
        '{"xmin":' +
        extent[0] +
        ',"ymin":' +
        extent[1] +
        ',"xmax":' +
        extent[2] +
        ',"ymax":' +
        extent[3] +
        ',"spatialReference":"wkid":4490}'
      ) +
      '&geometryType=esriGeometryEnvelope&inSR=4490&outFields=*' +
      '&outSR=4490';

    $.ajax({
      url: url,
      dataType: 'jsonp',
      success: function (response) {
        if (response.error) {
          console.log(
            response.error.message + '\n' + response.error.details.join('\n')
          );
        } else {
          // dataProjection will be read from document
          const features = esrijsonFormat.readFeatures(response, {
            featureProjection: projection,
          });
          if (features.length > 0) {
            var msg = ''
            features.forEach(f => {
              msg += ',' + f.id_
            });
            console.log('fetch: ' + msg)
            vectorSource.addFeatures(features);
          }
        }
      },
    });
  },
  strategy: tileStrategy(
    createXYZ({
      tileSize: 512,
    })
  ),
});

const vector = new VectorLayer({
  source: vectorSource,
  style: function (feature) {
    const classify = feature.get('activeprod');
    return styleCache['OIL'];
  },
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new WMTS({
        url: 'http://t0.tianditu.gov.cn/vec_c/wmts?tk=57aee604942c685286e5573c59e3a20c',
        name: "中国矢量1-14级",
        layer: "vec",
        style: "default",
        matrixSet: "c",
        format: "tiles",
        wrapX: true,
        tileGrid: new WMTSTileGrid({
          origin: getTopLeft(projectionExtent),
          resolutions: resolutions.slice(0, 15),
          matrixIds: matrixIds.slice(0, 15)
        })
      })
    }),
    new TileLayer({
      source: new WMTS({
        name: "中国矢量注记1-14级",
        url: "http://t0.tianditu.gov.cn/cva_c/wmts?tk=57aee604942c685286e5573c59e3a20c",
        layer: "cva",
        style: "default",
        matrixSet: "c",
        format: "tiles",
        wrapX: true,
        tileGrid: new WMTSTileGrid({
          origin: getTopLeft(projectionExtent),
          resolutions: resolutions.slice(0, 20),
          matrixIds: matrixIds.slice(0, 20)
        })
      })
    }), vector],
  target: document.getElementById('map'),
  view: new View({
    projection: 'EPSG:4326',
    center: [118.12, 27.33],
    zoom: 12,    //默认缩放级别
    maxZoom: 20, //最大缩放级别
    minZoom: 1,  //最小缩放级别
  }),
});

// const displayFeatureInfo = function (pixel) {
//   const features = [];
//   map.forEachFeatureAtPixel(pixel, function (feature) {
//     features.push(feature);
//   });
//   if (features.length > 0) {
//     const info = [];
//     let i, ii;
//     for (i = 0, ii = features.length; i < ii; ++i) {
//       info.push(features[i].get('field_name'));
//     }
//     document.getElementById('info').innerHTML = info.join(', ') || '(unknown)';
//     map.getTarget().style.cursor = 'pointer';
//   } else {
//     document.getElementById('info').innerHTML = '&nbsp;';
//     map.getTarget().style.cursor = '';
//   }
// };

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  const features = [];
  map.forEachFeatureAtPixel(pixel, function (feature) {
    features.push(feature);
  });
  if (features.length > 0) {
    debugger
    map.getTarget().style.cursor = 'pointer';
  } else {
    map.getTarget().style.cursor = '';
  }
});

// map.on('click', function (evt) {
//   // displayFeatureInfo(evt.pixel);
// });

let select = new Select();
select.on('select', function (e) {
  let features = e.target.getFeatures().array_;
  if (features.length != 1) {
    return
  }
  let feature = features[0]
  let value = JSON.parse(JSON.stringify(feature['values_']))
  value['geometry'] = null
  document.getElementById('info').innerHTML =
    '<br/>&nbsp;' + JSON.stringify(value);
});
map.addInteraction(select);