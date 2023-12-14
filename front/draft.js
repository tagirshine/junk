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
