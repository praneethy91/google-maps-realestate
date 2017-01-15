var map;
var markers = [];
var styles =
[
    {
        'featureType': 'administrative',
        'elementType': 'labels.text.stroke',
        'stylers': [
            {
                'color': '#ffffff'
            },
            {
                'weight': 4
            }
        ]
    },
    {
        'featureType': 'administrative',
        'elementType': 'labels.text.fill',
        'stylers': [
            {
                'color': '#e85113'
            }
        ]
    },
    {
        'featureType': 'transit.station',
        'stylers': [
            {
                'weight': 6
            },
            {
                'hue': '#e85113'
            }
        ]
    },
    {
        "featureType": "landscape.natural",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "color": "#e0efef"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "hue": "#1900ff"
            },
            {
                "color": "#c0e8e8"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
            {
                "lightness": 100
            },
            {
                "visibility": "simplified"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "transit.line",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "lightness": 700
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "all",
        "stylers": [
            {
                "color": "#7dcdcd"
            }
        ]
    }
];

var PlaceInfo = function(lat, lng, title){
    this.location = {
        'lat': lat,
        'lng': lng
    };
    this.title = title;
};

function initMap() {
    // Constructor creates a new map and binds it to the div in the page
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 40.7413549,
            lng: -73.9980244
        },
        zoom: 13,
        styles: styles,
        mapTypeControl: false
    });

    // Create an autocomplete box to input location around which to show
    var autocomplete = new google.maps.places.Autocomplete(
        document.getElementById('neighbourhood-text'));

    // Add a listener when user selects or presses enter after inputting a place
    autocomplete.addListener('place_changed', showPlaces);

    // Have only one infoWindow show at a time
    var largeInfowindow = new google.maps.InfoWindow();

    /* This is for closing the info window when user clicks on any
     * other area of the map or any other places of interest outside our markers
     */
    google.maps.event.addListener(map, "click", function(event) {
        largeInfowindow.marker = null;
        largeInfowindow.close();
    });

    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('ffd105');

    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('2ddb0f');

    // Add event listeners to the show and hide listings buttons
    document.getElementById('show-listings').addEventListener('click', showListings);
    document.getElementById('hide-listings').addEventListener('click', hideMarkers(markers));

    function setMarkers(placeInfos) {

        //Reinitialize the markers
        markers = [];
        // The following group uses the location array to create an array of markers on initialize.
        for (var i = 0; i < placeInfos.length; i++) {

            // Get the position from the location array.
            var position = placeInfos[i].location;
            var title = placeInfos[i].title;

            // Create a marker per location, and put into markers array.
            var marker = new google.maps.Marker({
                position: position,
                title: title,
                icon: defaultIcon,
                animation: google.maps.Animation.DROP,
                id: i
            });

            // Push the marker to our array of markers.
            markers.push(marker);

            // Create an onclick event to open an infowindow at each marker.
            marker.addListener('click', function() {
                populateInfoWindow(this, largeInfowindow);
            });

            // Two event listeners - one for mouseover, one for mouseout,
            // to change the colors back and forth.
            marker.addListener('mouseover', function() {
                this.setIcon(highlightedIcon);
                populateInfoWindow(this, largeInfowindow);
            });

            marker.addListener('mouseout', function() {
                this.setIcon(defaultIcon);
            });
        }
    }

    // This function populates the infowindow when the marker is clicked. We'll only allow
    // one infowindow which will open at the marker that is clicked, and populate based
    // on that markers position.
    function populateInfoWindow(marker, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
            infowindow.marker = marker;
            infowindow.setContent('<div>' + marker.position + '</div>');

            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick',function(){
                infowindow.marker = null;
            });

            var streetViewService = new google.maps.StreetViewService();
            var radius = 200;
            // In case the status is OK, which means the pano was found, compute the
            // position of the streetview image, then calculate the heading, then get a
            // panorama from that and set the options
            function getStreetView(data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    var nearStreetViewLocation = data.location.latLng;
                    var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                    infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                    var panoramaOptions = {
                        position: nearStreetViewLocation,
                        pov: {
                            heading: heading,
                            pitch: 30
                        }
                    };
                    var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
                }
                else
                {
                    infowindow.setContent('<div>' + marker.title + '</div>' +
                    '<div>No Street View Found</div>');
                }
            }

            // Use streetview service to get the closest streetview image within
            // 50 meters of the markers position
            streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);

            //Show the info window on the map
            infowindow.open(map, marker);
        }
    }

    // This function will loop through the markers array and display them all.
    function showListings() {
        var bounds = new google.maps.LatLngBounds();

        // Extend the boundaries of the map for each marker and display the marker
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(map);
            bounds.extend(markers[i].position);
        }

        map.fitBounds(bounds);
    }

    // This function will loop through the listings and hide them all.
    function hideMarkers(markers) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
    }

    //This makes the custom marker icon image
    function makeMarkerIcon(markerColor) {
        var markerImage = new google.maps.MarkerImage(
          'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
          '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21,34));
        return markerImage;
    }

    function showPlaces() {
        var place = autocomplete.getPlace();
        if (!place.geometry) {

            // User entered the name of a Place that was not suggested and
            // pressed the Enter key. Use geocode to get the place as fallback.
            var geocoder = new google.maps.Geocoder();

            // Get the address or place that the user entered.
            var address = document.getElementById('neighbourhood-text').value;
            // Make sure the address isn't blank.
            if (address == '') {
                window.alert('You must enter an area, or address.');
            }
            else {
                // Geocode the address/area entered to get the center. Then, center the map
                // on it and zoom in
                geocoder.geocode({
                    address: address
                },
                function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results[0].geometry.viewport) {
                            map.fitBounds(results[0].geometry.viewport);
                        }
                        else {
                            map.setCenter(results[0].geometry.location);
                            map.setZoom(17);
                        }
                        setFoursquareAreas(results[0].geometry.location);
                    }
                    else {
                        window.alert("No details available for input: '" + place.name + "'");
                    }
                });
            }
        }
        else if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
            setFoursquareAreas(place.geometry.location);
        }
        else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
            setFoursquareAreas(place.geometry.location);
        }
    }

    function setFoursquareAreas(location) {
        var places = [];
        $.getJSON('https://api.foursquare.com/v2/venues/search?ll='
            + location.lat() +',' + location.lng() +
            '&client_id=NEDAS2IC3HZXTZ0TZUGPPGKMYV3PZBVKS3ORT1VIX10GQRZY&client_secret=0QOLLTJMI5XODZXB5MQFCGCXJDAUXCMQSGAA4I1K0FGMEHT3&v=20170101',
            function(data) {
                $.each(data.response.venues, function(i, venue) {
                places.push(new PlaceInfo(venue.location.lat, venue.location.lng, venue.name))
            });

            setMarkers(places);
            showListings();
        });

        return places;
    }
}