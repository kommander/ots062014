var osc = require('osc-min');
var udp = require('dgram');


var settings = {
	port: 2020
}


sock = udp.createSocket("udp4", function(msg, rinfo) {
  var error;
  try {
    var oscMsg = osc.fromBuffer(msg);
    console.log(oscMsg.elements[0].args);
  } catch (_error) {
    error = _error;
    return console.log("invalid OSC packet");
  }
});

sock.bind(settings.port);