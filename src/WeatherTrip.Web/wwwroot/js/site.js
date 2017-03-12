﻿var tooCold = '#0000ff';
var tooHot = '#ff0000';
var justRight = '#14c92f';

var bounds;
var map;
var columns = 2;
var rows = 2;
var items;
var rectangles = [];
var daysFromNow = 0;
var date = '';

function getRandomColorString() {
    var colorNumber = Math.random() * (256 * 256 * 256 - 1);
    var color = '000000' + colorNumber.toString(16)
    color = color.substr(color.length - 6);

    return '#' + color;
}

function changeDay() {
    daysFromNow = document.getElementById('days').value;

    createRectangles();
}

function updateColors(event) {
    createRectangles();
}

function updateSliders(event) {
    columns = document.getElementById('cols').value;
    rows = document.getElementById('rows').value;

    loadWeathers();
}

function clearRectangles() {
    while (rectangles.length > 0) {
        var mapRectangle = rectangles.pop();

        mapRectangle.setMap(null);
    }
}

function loadWeathers() {
    items = new Array(rows);

    for (var i = 0; i < rows; ++i) {
        items[i] = new Array(columns);
    }

    var promises = [];
    for (var col = 0; col < columns; ++col) {
        for (var row = 0; row < rows; ++row) {
            promises.push(loadWeather(row, col));
        }
    }

    Promise.all(promises).then(function () {
        createRectangles();
    }, function (err) {
        // TODO - handle error
    });
}

function createRectangles() {
    clearRectangles();
    date = items[0][0].data.forecasts[daysFromNow].date;

    document.getElementById('date').innerText = date;

    for (var col = 0; col < columns; ++col) {
        for (var row = 0; row < rows; ++row) {
            (function (row, col) {
                var item = items[row][col];

                var data = item.data;
                var rect = item.rect;

                if (parseFloat(data.forecasts[daysFromNow].minTemp) < parseFloat(document.getElementById('minTemp').value)) {
                    color = tooCold;
                }
                else if (parseFloat(data.forecasts[daysFromNow].maxTemp) > parseFloat(document.getElementById('maxTemp').value)) {
                    color = tooHot;
                }
                else {
                    color = justRight;
                }

                var contentString = 'Location: ' + data.location.name + '\n' +
                    'Condition: ' + data.forecasts[daysFromNow].condition + '\n' +
                    'Min Temp: ' + data.forecasts[daysFromNow].minTemp + '\n' +
                    'Max Temp: ' + data.forecasts[daysFromNow].maxTemp;

                var rectangle = new google.maps.Rectangle({
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: color,
                    fillOpacity: 0.35,
                    map: map,
                    bounds: {
                        north: rect.top,
                        south: rect.bottom,
                        east: rect.right,
                        west: rect.left
                    },
                    clickable: true,
                    extraBoData: contentString
                });

                rectangles.push(rectangle);

                google.maps.event.addListener(rectangle, 'click', function (event) {
                    alert(rectangle.extraBoData);
                });

            })(row, col);
        }
    }
}

function loadWeather(row, col) {
    var NE = bounds.getNorthEast();
    var SW = bounds.getSouthWest();

    var top = NE.lat();
    var bottom = SW.lat();
    var left = SW.lng();
    var right = NE.lng();

    return new Promise(function (resolve, reject) {
        var rectTop = top + (bottom - top) * row / rows;
        var rectBottom = top + (bottom - top) * (row + 1) / rows;
        var rectLeft = left + (right - left) * col / columns;
        var rectRight = left + (right - left) * (col + 1) / columns;

        var centerLat = (rectTop + rectBottom) / 2;
        var centerLng = (rectLeft + rectRight) / 2;

        var url = '/api/weather/' + centerLat + ',' + centerLng;
        var request = new XMLHttpRequest();
        request.open('GET', url, true);

        request.onload = function (event) {
            if (request.status >= 200 && request.status < 400) {
                var item = {
                    "data": JSON.parse(request.responseText),
                    "rect": {
                        "top": rectTop,
                        "right": rectRight,
                        "bottom": rectBottom,
                        "left": rectLeft
                    }
                };

                items[row][col] = item;

                return resolve(item);
            } else {
                return reject(request.status);
                // TODO - handle error
            }
        };

        request.onerror = function () {
            return reject("error?");
            // TODO - handle error
        };

        request.send();
    });
}

function initMap() {
    var minTemp = document.getElementById('minTemp');
    var maxTemp = document.getElementById('maxTemp');

    minTemp.addEventListener('change', updateColors)
    maxTemp.addEventListener('change', updateColors)

    var rowSlider = document.getElementById('rows');
    var colSlider = document.getElementById('cols');

    rowSlider.addEventListener('change', updateSliders)
    colSlider.addEventListener('change', updateSliders)

    var daysSlider = document.getElementById('days');

    daysSlider.addEventListener('change', changeDay)
    daysSlider.addEventListener('input', changeDay)

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 9,
        center: { lat: 34.038891, lng: -84.296173 },
        mapTypeId: 'terrain'
    });

    google.maps.event.addListenerOnce(map, 'idle', function () {
        bounds = map.getBounds();

        loadWeathers();
    });
}