var $loading,
    $map,
    $and,
    $filters;
  MadParks = new Object();
  MadParks.map = {};
  MadParks.parks = [];
  MadParks.filters = new Array;
  MadParks.infoWindow = new google.maps.InfoWindow();
  MadParks.currentPosition = {};
  MadParks.zoom = 13;
  MadParks.locationPageSuccess = function (position) {
    var lat = position.coords.latitude,
      lng = position.coords.longitude;
    MadParks.currentPosition.lat = lat;
    MadParks.currentPosition.lng = lng;
    MadParks.initGMap(lat, lng);
  }
  MadParks.manualLocation = function () {
    /// default to Capitol
    MadParks.currentPosition.lat = 43.07474;
    MadParks.currentPosition.lng = -89.38414;
    MadParks.initGMap(43.07474, -89.38414);
  }
  MadParks.initGMap = function (lat, lng) {
    $loading.removeClass('hidden');
    delete this.map;
    var center = new google.maps.LatLng(lat, lng),
      myOptions = {
        zoom: this.zoom,
        center: center,
        draggable: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        panControl: true,
        streetViewControl: false,
        zoomControl: true,
        scaleControl: false,
        keyboardShortcuts: false,
        scrollwheel: true,
        mapTypeControlOptions: {
          mapTypeIDs: [google.maps.MapTypeId.ROADMAP, '_map_style']
        }
      },
      validParks = [],
      i = 0;
    this.map = new google.maps.Map($map, myOptions);
    this.map.setCenter(center);
    this.filters = {};
    sendAJAX("http://data.cityofmadison.com/resource/svr6-6gvb.json",
      "GET",
      function (resp) {
        if (resp.status === 200) {
          var filters = [],
              goodToGo;
          MadParks.parks = JSON.parse(resp.responseText);
          for (i = 0; i < $filters.length; i++) {
            if ($filters[i].checked) {
                filters.push($filters[i].value);
            }
          }
          MadParks.filters = filters;
          if (MadParks.filters.length) {
            if ($and.checked) {
              validParks = MadParks.parks.filter(function (park) {
                goodToGo = true;
                for (i = 0; i < MadParks.filters.length; i++) {
                  if (MadParks.filters[i] === "shelter") {
                    if (!park["non_reservable_shelter"] && !park["reservable_shelter"]) {
                      goodToGo = false;
                      return false;
                    }
                  } else if (!park[MadParks.filters[i]]) {
                      goodToGo = false;
                      return false;
                  }
                }
                return goodToGo;
              });
            } else {
              validParks = MadParks.parks.filter(function (park) {
                goodToGo = false;
                for (i = 0; i < MadParks.filters.length; i++) {
                  if (MadParks.filters[i] === "shelter") {
                    if (park["non_reservable_shelter"] || park["reservable_shelter"]) {
                      goodToGo = true;
                      return true;
                    }
                  } else if (park[MadParks.filters[i]]) {
                    goodToGo = true;
                    return true;
                  }
                }
                return goodToGo;
              });
            } /// end if/else and-checked
          } else {
            validParks = MadParks.parks;
          } /// end if madparks.filters.length
          for (i = 0; i < validParks.length; i++) {
            MadParks.addToMap(validParks[i]);
          }
        } else {
          if(confirm("Unknown error. Retry?")) {
            window.location.reload();
          }
        }
        $loading.addClass('hidden');
      }
    );
  }
  MadParks.addToMap = function (obj) {
    var latlng = new google.maps.LatLng(obj.location.latitude, obj.location.longitude),
      options = {
        map: this.map,
        position: latlng,
        clickable: true,
        html: this.parkInfoOutput(obj),
        title: obj.name
      },
      marker;
    marker = new google.maps.Marker(options);
    google.maps.event.addListener(marker, 'click', this.showInfo);
  }
  MadParks.showInfo = function (event) {
    MadParks.infoWindow.setContent(this.html);
    MadParks.infoWindow.setPosition(this.position);
    MadParks.infoWindow.open(MadParks.map);
  }
  MadParks.parkInfoOutput = function (park) {
    var output = "Name: " + park.name + "<BR>Address: " + park.address + "<BR>Lat/Lng: " + park.location.latitude + ", " + park.location.longitude + "<br />";
    if (park.basketball) {
      output += "Basketball, ";
    }
    if (park.b_cycle_station){
      output += "B-Cycle Station, ";
    }
    if (park.drinking_fountain) {
      output += "Drinking Fountain, ";
    }
    if (park.open_field) {
      output += "Open Field, ";
    }
    if (park.parking_lot) {
      output += "Parking Lot, ";
    }
    if (park.playground) {
      output += "Playground, ";
    }
    if (park.reservable_shelter || park.non_reservable_shelter) {
      output += "Shelters, ";
    }
    if (park.restroom) {
      output += "Restrooms, ";
    }
    if (park.scenic_overlook) {
      output += "Scenic Overlook, ";
    }
    if (park.tennis) {
      output += "Tennis, ";
    }
    if (park.volleyball) {
      output += "Volleyball, ";
    }
    return output.substr(0, output.length - 2);
  }
  function var_dump(obj) {
    var str = "",
        i;
    for (i in obj) {
      str += i + ":" + obj[i] + "\n";
    }
    return str;
  }
  function sendAJAX(url, method, callback, data, headers) {
    var xhReq = new XMLHttpRequest();
    if (method !== "POST" && method !== "GET" && method !== "PUT" && method !== "DELETE") {
      return false;
    }
    xhReq.open(method, url);
    if (typeof(headers) != "undefined") {
      for (var i = 0; i < headers.headers.length; i++) {
        xhReq.setRequestHeader(headers.headers[i].type, headers.headers[i].value);
      }
    }
    xhReq.onreadystatechange = function () {
      if (xhReq.readyState != 4) return;
      callback(xhReq);
    };
    if (xhReq.readyState === 4 ) return xhReq;
    xhReq.send(data);
  }
  Element.prototype.hasClass = function (name) {
    return this.className.indexOf(name) !== -1;
  }
  Element.prototype.removeClass = function (name) {
    if (this.hasClass(name)) {
      this.className = this.className.replace(name, '');
      return true;
    } else {
      return false;
    }
  }
  Element.prototype.addClass = function (name) {
    if (!this.hasClass(name)) {
      this.className += ' ' + name;
      return true;
    } else {
      return false;
    }
  }
  NodeList.prototype.addEventListener = function (event, func) {
    for (var i = 0; i < this.length; i++) {
      this[i].addEventListener(event, func);
    }
  }
  NodeList.prototype.removeEventListener = function (event, func) {
    for (var i = 0; i < this.length; i++) {
      this[i].removeEventListener(event, func);
    }
  }
  document.addEventListener("DOMContentLoaded", function (e) {
    "use strict";
    $loading = document.getElementById('loading');
    $map = document.getElementById('map');
    $and = document.getElementById('and');
    $filters = document.getElementsByClassName('filter');
    if (navigator.geolocation) { //fire up geolocation
      setTimeout(function () {
        navigator.geolocation.getCurrentPosition(MadParks.locationPageSuccess, MadParks.manualLocation, {enableHighAccuracy: true});
      }, 500);
    } else { //or just ask
      MadParks.manualLocation();
    }
    document.getElementsByTagName('input').addEventListener('change', function (e) {
      MadParks.initGMap(MadParks.currentPosition.lat, MadParks.currentPosition.lng);
    });
  });
