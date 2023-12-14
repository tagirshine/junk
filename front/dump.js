
  const iconFeature = new Feature({
    geometry: new Point(fromLonLat([18.848,42.286])), //42.532, 18.858
    name: 'Meow',
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

  const rasterLayer = new TileLayer({
    source: new OSM()
  });
  const map = new Map({
    target: 'map',
    layers: [
      rasterLayer,
    ],
    view: new View({
      center: fromLonLat([ 18.837222, 42.73]),
      zoom: 9
    })
  });
  const overlay = new Overlay({
    element: container,
    autoPan: {
      animation: {
        duration: 250,
      },
    },
  });

  const vectorSource = new SourceVector({
    features: [iconFeature],
  });

  const vectorLayer = new LayerVector({
    source: vectorSource,
  });

  console.log(vectorLayer)

  map.addLayer(vectorLayer)
  console.log(closer)

  closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
  };

  let popover;
  function disposePopover() {
    if (popover) {
      popover.dispose();
      popover = undefined;
    }
  }
  const element = document.getElementById('popupMarker');

  const popup = new Overlay({
    element: element,
    positioning: 'bottom-center',
    stopEvent: false,
  });
  map.addOverlay(popup);
  map.on('click', function (evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
    });
    disposePopover();
    if (!feature) {
      return;
    }

    popup.setPosition(evt.coordinate);
    popover = new bootstrap.Popover(element, {
      placement: 'top',
      html: true,
      content: feature.get('name'),
    });
    popover.show();

  });

  content.innerHTML = '<b>Hello world!</b><br />I am a popup.';
  overlay.setPosition(fromLonLat([18.837222, 42.73]));
});
