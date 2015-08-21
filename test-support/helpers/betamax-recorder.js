import {
  getServer
} from './fake-server';

var responses = [], strings = [];
var allResponseUrls = [];

//turning headers into js is a real pain
function parseResponseHeaders(headerStr) {
  var headers = {};
  if (!headerStr) {
    return headers;
  }
  var headerPairs = headerStr.split('\u000d\u000a');
  for (var i = 0; i < headerPairs.length; i++) {
    var headerPair = headerPairs[i];
    var index = headerPair.indexOf('\u003a\u0020');
    if (index > 0) {
      var key = headerPair.substring(0, index);
      var val = headerPair.substring(index + 2);
      headers[key] = val;
    }
  }
  return headers;
}

export default {
  setup: function() {
    var server = getServer();
    // server.responses.mapBy('url').forEach(function(response) {
    //   allResponseUrls[response] = true;
    // });

    //listen to incoming xhr requests
    $( document ).ajaxSuccess(function( event, xhr, settings ) {
      var url = settings.url;
      var newResponse =  {
        url: url,
        data: xhr.responseText,
        type: settings.type,
        status: xhr.status,
        headers: parseResponseHeaders(xhr.getAllResponseHeaders())
      };

      var key = url + ' ' + settings.type;

      if(!responses[key]){
        responses[key] = []
      }
      responses[key].push(newResponse)

      //if response isn't in old or new cassettes, add it to new one
      // if(!allResponseUrls[url]) {
      //   responses.push(newResponse);
      //   allResponseUrls[newResponse.url] = true;
      //
      //   //ensure that if a request is added to new cassette, it
      //   //doesn't hit the server again
      //   // server.respondWith(
      //   //   settings.type, newResponse.url,
      //   //   [
      //   //     newResponse.status,
      //   //     newResponse.headers,
      //   //     JSON.stringify(JSON.parse(newResponse.data))
      //   //   ]
      //   // );
      // }
    });
  },

  download: function() {
    //convert responses into string expected by sinon
    strings.push("export default function(server) {\n\n");
    if (Object.keys(responses).length > 0){

      Object.keys(responses).forEach(function(key, index) {
        var rArray = responses[key];

        strings.push("var stack" + index + "= [\n");
        rArray.forEach(function(response){
          strings.push("  [" + response.status + ",\n");
          strings.push(JSON.stringify(response.headers) + ",\n");
          strings.push(JSON.stringify(JSON.stringify(JSON.parse(response.data))) + "],\n");
        });
        strings.push("];\n");
        strings.push("server.respondWith( '"+ rArray[0].type + "', \n");
        strings.push("'" + rArray[0].url +  "',\n");
        strings.push("function(request){\n");
        strings.push("var r = stack" + index +".shift;\n");
        strings.push("request.respond.apply(this,r);\n");
        strings.push("});\n\n");
      });

      // responses.forEach(function(response) {
      //   strings.push("server.respondWith( '"+ response.type + "', \n");
      //   strings.push("'" + response.url +  "',\n");
      //   strings.push("  [\n " + response.status + ",\n");
      //   strings.push(JSON.stringify(response.headers) + ",\n");
      //   strings.push(JSON.stringify(JSON.stringify(JSON.parse(response.data))) + "\n");
      //   strings.push("]);\n\n");
      // });

      strings.push("}");
      //html 5 for downloading recordings
      var blob = new window.Blob(strings);
      var encodedUri = window.URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "cassette.js");
      link.click();

      //ensure that users knows about the new cassette
      window.alert("Missing recorded data. New cassette recorded");
    }
    this.reset();
  },

  reset: function(){
    // responses = [];
    responses = {};
    strings = [];
  }
};
