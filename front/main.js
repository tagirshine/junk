import './style.css';

import CustomMap from "./custommap";
import receiveData from "./receiver";

const CENTER_MAP = [19, 42.73];

document.addEventListener("DOMContentLoaded", (event) => {

  let mapInstance;

  const container = document.getElementById('popup');
  const content = document.getElementById('popup-content');
  const closer = document.getElementById('popup-closer');

  mapInstance = new CustomMap(container,content,closer, CENTER_MAP);
  console.log( mapInstance)

  Promise.all([receiveData()]).then(data => {
    console.log(data)
    mapInstance.addMarkers(data[0])
  });


});
