var map;
function initMap() {
    // Constructor creates a new map and binds it to the div in the page
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 40.7413549,
            lng: -73.9980244
        },
        zoom: 13
    });
}