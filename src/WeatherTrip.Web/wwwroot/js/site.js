var tooCold = '#0000ff';
var tooHot = '#ff0000';
var justRight = '#14c92f';

var map;
var columns = 2;
var rows = 2;
var items;
var rectangles = [];

function getRandomColorString() {
    var colorNumber = Math.random() * (256 * 256 * 256 - 1);
    var color = '000000' + colorNumber.toString(16)
    color = color.substr(color.length - 6);

    return '#' + color;
}

function updateColors(event) {
    clearRectangles();
    createRectangles();
}

function clearRectangles() {
    while (rectangles.length > 0) {
        var mapRectangle = rectangles.pop();

        mapRectangle.setMap(null);
    }
}

function createRectangles() {
    for (var col = 0; col < columns; ++col) {
        for (var row = 0; row < rows; ++row) {
            (function (row, col) {
                var item = items[row][col];

                var data = item.data;
                var rect = item.rect;

                if (parseFloat(data.forecasts[0].minTemp) < parseFloat(document.getElementById('minTemp').value)) {
                    color = tooCold;
                }
                else if (parseFloat(data.forecasts[0].maxTemp) > parseFloat(document.getElementById('maxTemp').value)) {
                    color = tooHot;
                }
                else {
                    color = justRight;
                }

                var contentString = 'Location: ' + data.location.name + '\n' +
                    'Condition: ' + data.forecasts[0].condition + '\n' +
                    'Min Temp: ' + data.forecasts[0].minTemp + '\n' +
                    'Max Temp: ' + data.forecasts[0].maxTemp;

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

function loadWeather(bounds, row, col) {
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
            }
        };

        request.onerror = function () {
            return reject("error?");
        };

        request.send();
    });
}

function initMap() {
    var minTemp = document.getElementById('minTemp');
    var maxTemp = document.getElementById('maxTemp');

    minTemp.addEventListener('change', updateColors)
    maxTemp.addEventListener('change', updateColors)

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 9,
        center: { lat: 34.038891, lng: -84.296173 },
        mapTypeId: 'terrain'
    });

    items = new Array(rows);

    for (var i = 0; i < rows; ++i) {
        items[i] = new Array(columns);
    }

    google.maps.event.addListenerOnce(map, 'idle', function () {
        var bounds = map.getBounds();
        var promises = [];
        for (var col = 0; col < columns; ++col) {
            for (var row = 0; row < rows; ++row) {
                promises.push(loadWeather(bounds, row, col));
            }
        }

        Promise.all(promises).then(function () {
            createRectangles();
        }, function (err) {
            // error occurred
        });
    });
}