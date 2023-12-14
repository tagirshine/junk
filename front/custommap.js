import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import {fromLonLat} from 'ol/proj';
import Overlay from 'ol/Overlay.js';
// import XYZ from 'ol/source/XYZ.js';
// import {toLonLat} from 'ol/proj.js';
import Point from 'ol/geom/Point.js';
import  Feature from 'ol/Feature.js';
import Style from 'ol/style/Style.js';
import Icon from 'ol/style/Icon.js';

import SourceVector from 'ol/source/vector';
import LayerVector from 'ol/layer/vector';

export default class CustomMap {

    constructor(container, content, closer, centerMap) {
        const rasterLayer = new TileLayer({
            source: new OSM()
        });
        this.map = new Map({
            target: 'map',
            layers: [
                rasterLayer,
            ],
            view: new View({
                center: fromLonLat(centerMap),
                zoom: 9
            })
        });

        this.popover = undefined;
    }

    addMarkers(data) {
        console.log(data)
        data.forEach((item) => {

            const iconFeature = new Feature({
                geometry: new Point(fromLonLat([item.lon, item.lat])),
                name: item.name,
                description: item.description,
                population: 4000,
                rainfall: 500,
            });
            const iconStyle = new Style({
                image: new Icon({
                    anchor: [0.5, 48],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    src: 'icon.png',
                }),
            });

            iconFeature.setStyle(iconStyle);
            const vectorSource = new SourceVector({
                features: [iconFeature],
            });

            const vectorLayer = new LayerVector({
                source: vectorSource,
            });
            this.map.addLayer(vectorLayer)
        })

        const element = document.getElementById('popupMarker');
        const popup = new Overlay({
            element: element,
            positioning: 'bottom-center',
            stopEvent: false,
        });


        this.map.addOverlay(popup);

        const self = this;
        this.map.on('click', function (evt) {
            const feature = self.map.forEachFeatureAtPixel(evt.pixel, function (feature) {
                return feature;
            });
            self.disposePopover();
            if (!feature) {
                return;
            }
            popup.setPosition(evt.coordinate);
            self.popover = new bootstrap.Popover(element, {
                placement: 'top',
                html: true,
                content: `<div class="popContainer">
                            <h4>${feature.get('name')}</h4>
                            <div>${feature.get('description')}</div>
                            <h5>Фото:</h5>
                            <div class="imgContainer">                          
                                <img src="/mini001.png" alt="1">
                                <img src="/mini002.png" alt="2">
                            </div>
                            <h5>Добавлено:</h5>
                            <div>Пользователь <b>@Maurizio</b></div>
                            <div>25 Октября 2023</div>
                            </div>`,
            });
            self.popover.show();
        })
    }

    disposePopover() {
        if (this.popover) {
            this.popover.dispose();
            this.popover = undefined;
        }
    }
}

// }
// const iconFeature = new Feature({
//     geometry: new Point(fromLonLat([18.848,42.286])), //42.532, 18.858
//     name: 'Meow',
//     population: 4000,
//     rainfall: 500,
// });
// const iconStyle = new Style({
//     image: new Icon({
//         anchor: [0.5, 48],
//         anchorXUnits: 'fraction',
//         anchorYUnits: 'pixels',
//         src: 'icon.png',
//     }),
// });
//
// iconFeature.setStyle(iconStyle);
//
//
//
// const rasterLayer = new TileLayer({
//     source: new OSM()
// });
// const map = new Map({
//     target: 'map',
//     layers: [
//         // new TileLayer({
//         //   source: new OSM()
//         // })
//         rasterLayer,
//         // ,
//         //   vectorLayer
//     ],
//     view: new View({
//         center: fromLonLat([ 18.837222, 42.73]),
//         zoom: 9
//     })
// });
//
// //
// const overlay = new Overlay({
//     element: container,
//     autoPan: {
//         animation: {
//             duration: 250,
//         },
//     },
// });
//
// const vectorSource = new SourceVector({
//     features: [iconFeature],
// });
//
// const vectorLayer = new LayerVector({
//     source: vectorSource,
// });
//
//
// map.addLayer(vectorLayer)
// // map.addOverlay(overlay);
// console.log(closer)
//
// closer.onclick = function () {
//     overlay.setPosition(undefined);
//     closer.blur();
//     return false;
// };
//
//
// let popover;
// function disposePopover() {
//     if (popover) {
//         popover.dispose();
//         popover = undefined;
//     }
// }
// const element = document.getElementById('popupMarker');
//
// const popup = new Overlay({
//     element: element,
//     positioning: 'bottom-center',
//     stopEvent: false,
// });
// map.addOverlay(popup);
// map.on('click', function (evt) {
//     const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
//         return feature;
//     });
//     disposePopover();
//     if (!feature) {
//         return;
//     }
//
//     popup.setPosition(evt.coordinate);
//     popover = new bootstrap.Popover(element, {
//         placement: 'top',
//         html: true,
//         content: feature.get('name'),
//     });
//     popover.show();
//
// });

// }
// }


