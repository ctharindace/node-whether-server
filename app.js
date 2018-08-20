const request = require('request');
const express = require('express');
const hbs = require('hbs');
const fs = require('fs');


var app = express();

app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');

app.use((request, response, next) => {
  var now = new Date();
  var log = `${now} | url : ${request.url} | ${request.method} \n`;
  console.log(log);
  fs.appendFile('log/server.log', log, (error) => {
    if (error) {
      console.log('Error writing log to the file');
    }
  });
  next();
});

/*
app.use((request, response, next) => {
  response.render('maintenance.hbs')
});
*/

app.use(express.static(__dirname + '/public'));

hbs.registerHelper('currentYear', () => {
  return new Date().getFullYear();
});

hbs.registerHelper('toUpper', (item) => {
  return item.toUpperCase();
});

var asyncGeoData = (address) => {
  var encodedAddress = encodeURIComponent(address);
  return new Promise((resolve, reject) => {
    request({
      url: `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=AIzaSyC9MgOgIqfidLsiOUt2sNIL7aFgmuk4d9E`,
      json: true
    }, (error, response, body) => {
      if (error) {
        reject('server error');
      } else if (body.status === 'ZERO_RESULTS') {
        reject('no such address');
      } else if (body.status === 'OK') {
        resolve({
          address: body.results[0].formatted_address,
          lattitude: body.results[0].geometry.location.lat,
          longitude: body.results[0].geometry.location.lng
        })
      } else {
        reject(body.status);
      }
    })
  })
}

var asyncWeatherData = (locationData) => {
  return new Promise((resolve, reject) => {
    request({
      url: `https://api.darksky.net/forecast/5de8ffa92361b2022e31c6e469faced6/${locationData.lattitude},${locationData.longitude}`,
      json: true
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(body.currently)
      } else {
        reject('Unabale to fetch the weather from https://api.darksky.net');
      }
    });
  })
}

app.get('/weather', (request, response) => {
  asyncGeoData('Bandarawela').then((geoData) => {
    return asyncWeatherData(geoData);
  }).then((weatherData) => {
    response.send(weatherData);
  }).catch((errorMessage) => {
    response.send(errorMessage);
  })
});

app.get('/about', (requset, response) => {
  response.render('about.hbs', {
    pageTitle: 'About page'
  });
});

app.get('/', (requset, response) => {
  response.render('index.hbs', {
    pageTitle: 'Home Page',
    welcomeMessage: 'Welcome to the home page'
  });
});

app.listen(3000, () => {
  console.log("server is up on port 3000");
});