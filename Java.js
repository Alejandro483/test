new WOW().init();
// Create object to hold user input of latitude/longitude coordinates
var input = {};

var playlist = [];
var playlistDiv = document.getElementById("playlist-div");
var tripDurationHTML = document.getElementById("trip-duration");
var playlistDurationHTML = document.getElementById("playlist-duration");

//to connect to library to convertaddress to lat/long
var placesStart = places({
  appId: "plRUJ22SXG0U",
  apiKey: "7621bbb9b57f4f8ddb04604ff8d24a00",
  container: document.querySelector("#startingPoint"),
});

var placesEnd = places({
  appId: "plRUJ22SXG0U",
  apiKey: "7621bbb9b57f4f8ddb04604ff8d24a00",
  container: document.querySelector("#endPoint"),
});

//on event - clicking 'get playlist' button, grab lat/long from variables where stored
placesStart.on("clear", function (suggestion) {
  input.starting = "";
});

placesEnd.on("clear", function (suggestion) {
  input.destination = "";
});

placesStart.on("change", function (suggestion) {
  input.starting = suggestion.suggestion.latlng;
});

placesEnd.on("change", function (suggestion) {
  input.destination = suggestion.suggestion.latlng;
});

// Grab any existing data from local storage
if (localStorage.getItem("playlist") !== null) {
  var tripDuration = JSON.parse(localStorage.getItem("trip-duration"));
  var playlistDuration = JSON.parse(localStorage.getItem("playlist-duration"));
  playlist = JSON.parse(localStorage.getItem("playlist"));
  showData(tripDuration, playlistDuration);
} else {
  playlist = [];
}

function showData(tripDuration, playlistDuration) {
  playlistDiv.textContent = "";
  tripDurationHTML.textContent = "";
  playlistDurationHTML.textContent = "";

  // Put durations into HTML
  tripDurationHTML.textContent =
    "Trip Duration: " + (tripDuration / 60).toFixed(2) + " minutes";
  playlistDurationHTML.textContent =
    "Playlist Duration: " + (playlistDuration / 60).toFixed(2) + " minutes";

  // Put playlist into HTML
  for (let index = 0; index < playlist.length; index++) {
    const element = playlist[index];
    var songDiv = document.createElement("p");
    songDiv.textContent = element.title;
    playlistDiv.appendChild(songDiv);
  }
}

// When Get Playlist buton is clicked, run the following function
document
  .getElementById("submit-button")
  .addEventListener("click", async function (event) {
    // Prevent page from refreshing upon button click
    event.preventDefault();

    //if starting or destination fields are empty, exit the function
    if (!input.starting || !input.destination) {
      return;
    }

    // Create Mapbox query URL based on user input
    var mapBoxQueryURL =
      "https://api.mapbox.com/directions/v5/mapbox/driving/" +
      input.starting.lng +
      "%2C" +
      input.starting.lat +
      "%3B" +
      input.destination.lng +
      "%2C" +
      input.destination.lat +
      "?alternatives=true&geometries=geojson&steps=true&access_token=pk.eyJ1Ijoia2F5Z3JvZyIsImEiOiJjazh2dnBueXgwMnltM3ByejY2Y3hlM25kIn0.jyN4BskKiVdTLxWbxcPWsw";

    // Call function to make Mapbox API call; await until API call is done and store response in mapResponse variable
    var mapResponse = await apiCall(mapBoxQueryURL);

    // Store trip duration from first route from API call response
    var tripDuration = mapResponse.routes[0].duration;

    // Convert duration to minutes
    var minutes = tripDuration / 60;

    playlist.length = 0;

    // Call function to make Deezer API call; await until API call is done and store response in songs variable
    var playlistDuration = await createPlaylist(tripDuration, 0);

    showData(tripDuration, playlistDuration);

    // Store playlist in local storage
    localStorage.clear();
    localStorage.setItem("playlist", JSON.stringify(playlist));
    localStorage.setItem("trip-duration", JSON.stringify(tripDuration));
    localStorage.setItem("playlist-duration", JSON.stringify(playlistDuration));
  });

async function getSongs(URL) {
  // Create query URL for Deezer API call
  var deezerQueryURL = URL;

  // Make Deezer API call; await until API call is done and store response
  var deezerResponse = await apiCall(deezerQueryURL);

  // Create array to hold song data
  var songs = [];

  // Loop through API response array and add applicable song data to new songs array
  for (var i = 0; i < deezerResponse.data.length; i++) {
    var e = deezerResponse.data[i];
    songs.push({ title: e.title, artist: e.artist.name, duration: e.duration });
  }
  return songs;
}

async function createPlaylist(tripDuration, playlistDuration) {
  var songs = await getSongs(createDeezerUrl(playlist.length));

  for (let i = 0; i < songs.length && playlistDuration < tripDuration; i++) {
    playlist.push(songs[i]);
    playlistDuration += songs[i].duration;
  }
  if (playlistDuration < tripDuration) {
    return createPlaylist(tripDuration, playlistDuration);
  }

  return playlistDuration;
}
function createDeezerUrl(index) {
  return (
    "https://deezerdevs-deezer.p.rapidapi.com/search?q=eminem&index=" + index
  );
}
// API call function
function apiCall(queryURL) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", queryURL);
    if (queryURL.includes("deezer")) {
      xhr.setRequestHeader(
        "x-rapidapi-host",
        "deezerdevs-deezer.p.rapidapi.com"
      );
      xhr.setRequestHeader(
        "x-rapidapi-key",
        "ec3c5ea0ebmsh0160b4b2056a0a1p1c3058jsn53757ea9b4b5"
      );
    }
    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject("Request failed.  Returned status of " + xhr.status);
      }
    };
    xhr.send();
  });
}
