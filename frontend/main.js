import './style.css';

import CustomMap from "./custommap";
import receiveData from "./receiver";

const CENTER_MAP = [19, 42.73];

document.addEventListener("DOMContentLoaded", (event) => {

  let mapInstance;
  // receiveData().then(data => {
    // console.log(data)
  // })
  // console.log("DOM fully loaded and parsed");

  const container = document.getElementById('popup');
  const content = document.getElementById('popup-content');
  const closer = document.getElementById('popup-closer');

  mapInstance = new CustomMap(container,content,closer, CENTER_MAP);
  console.log( mapInstance)

  Promise.all([receiveData()]).then(data => {
    mapInstance.addMarkers(data[0])
  });


});
