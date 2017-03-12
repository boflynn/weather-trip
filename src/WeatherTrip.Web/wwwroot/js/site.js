var tooCold = '#0000ff';
var tooHot = '#ff0000';
var justRight = '#14c92f';

function getRandomColorString() {
    var colorNumber = Math.random() * (256 * 256 * 256 - 1);
    var color = '000000' + colorNumber.toString(16)
    color = color.substr(color.length - 6);

    return '#' + color;
}

// This example adds a red rectangle to a map.

function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 9,
        center: { lat: 34.038891, lng: -84.296173 },
        mapTypeId: 'terrain'
    });

    google.maps.event.addListenerOnce(map, 'idle', function () {
        var bounds = map.getBounds();

        var NE = bounds.getNorthEast();
        var SW = bounds.getSouthWest();

        var top = NE.lat();
        var bottom = SW.lat();
        var left = SW.lng();
        var right = NE.lng();

        var columns = 2;
        var rows = 2;

        for (var col = 0; col < columns; ++col) {
            for (var row = 0; row < rows; ++row) {
                (function (row, col) {
                    var rectTop = top + (bottom - top) * row / rows;
                    var rectBottom = top + (bottom - top) * (row + 1) / rows;
                    var rectLeft = left + (right - left) * col / columns;
                    var rectRight = left + (right - left) * (col + 1) / columns;

                    var centerLat = (rectTop + rectBottom) / 2;
                    var centerLng = (rectLeft + rectRight) / 2;

                    // var url = 'http://localhost:5001/api/weather/30076';// + centerLat + ',' + centerLng;
                    var url = '/api/weather/' + centerLat + ',' + centerLng;
                    var request = new XMLHttpRequest();
                    request.open('GET', url, true);

                    request.onload = function (event) {
                        if (request.status >= 200 && request.status < 400) {
                            var data = JSON.parse(request.responseText);

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
                                    north: rectTop,
                                    south: rectBottom,
                                    east: rectRight,
                                    west: rectLeft
                                },
                                clickable: true,
                                extraBoData: contentString
                            });

                            google.maps.event.addListener(rectangle, 'click', function (event) {
                                alert(rectangle.extraBoData);
                                // alert("Latitude: " + event.latLng.lat() + " " + ", longitude: " + event.latLng.lng());
                            });

                            // var infoWindow = new google.maps.InfoWindow();
                            // // Set the info window's content and position.
                            // infoWindow.setContent(contentString);
                            // infoWindow.setPosition({ lat: centerLat, lng: centerLng });

                            // infoWindow.open(map);
                        } else {

                        }
                    };

                    request.onerror = function () {
                    };

                    request.send();
                })(row, col);
            }
        }
    });
}