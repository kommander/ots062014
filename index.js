var osc = require('osc-min');
var udp = require('dgram');
var os = require('os');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var settings = {
  port: 12000
}

// Network Interfaces
var netInterfacesObj = os.networkInterfaces();
var netInterfacesArr = [];
var netKeys = [];
for(var k in netInterfacesObj){
  netKeys.push(k);
}
for(var i = 0; i < netKeys.length; i++) {
  var faces = netInterfacesObj[netKeys[i]];
  for(var j = 0; j < faces.length; j++){
    if(faces[j].family == 'IPv4') {
      netInterfacesArr.push(faces[j]);
    }
  }
}

console.log(netInterfacesArr);

//
// Discover other OSC nodes
function discover(){
  // Get Network interfaces
  for(var i = 0; i < netInterfacesArr.length; i++) {
    
    var addressArr = netInterfacesArr[i].address.split('.');

    // Message to send
    var buf = osc.toBuffer({
      address: "/discover",
      args: [
        12, "heythere", new Buffer("iLive"), {
          type: "integer",
          value: 1
        }
      ]
    });

    // Iterate thorugh local address space
    for(var last = 0; last <= 255; last++){
      addressArr[3] = last;
      sock.send(buf, 0, buf.length, settings.port, addressArr.join('.'));
      console.log('Discovering:', addressArr.join('.'));
    }
  }
}

// OSC Socket
var sock = udp.createSocket("udp4", function(msg, rinfo) {
  var error;
  try {
    var oscMsg = osc.fromBuffer(msg);
    for(e = 0; e < oscMsg.elements.length; e++){
      var elem = oscMsg.elements[e];

      switch(elem.address){
        case '/visual':
          var colors = [];
          var col = [];
          var it = 0;
          for(var c = 0; c < elem.args.length; c++){
            it++;
            col.push(elem.args[c].value);
            if(it == 3){
              colors.push(col);
              col = [];
              it = 0;
            }
          }
          console.log('sending:', colors);
          io.emit('/visual', { colors: colors });
          break;
        default:
          io.emit('/any', { colors: colors });
          console.log('No idea what to do with that OSC data...');
          break;
      }
    }
    
  } catch (_error) {
    error = _error;
    return console.log("invalid OSC packet", rinfo);
  }
});
sock.bind(settings.port);

//setInterval(discover, 3000);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

app.get('/static/jquery.min.js', function(req, res){
  res.sendfile('static/jquery.min.js');
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});