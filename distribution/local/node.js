const http = require('http');
const url = require('url');
const log = require('../util/log');
const fs = require('fs');
const { deserialize } = require("../util/serialization");
const { serialize } = require("../util/serialization");



/*
    The start function will be called to start your node.
    It will take a callback as an argument.
    After your node has booted, you should call the callback.
*/


const start = function(callback) {
  const server = http.createServer((req, res) => {
    /* Your server will be listening for PUT requests. */
    if (req.method === 'PUT') {
      /*
        The path of the http request will determine the service to be used.
        The url will have the form: http://node_ip:node_port/service/method
      */
        const path = req.url;
        const url_arr = path.split("/");
        const gid = url_arr[url_arr.length-3];
        const service = url_arr[url_arr.length-2];
        const method = url_arr[url_arr.length-1];

      /*

        A common pattern in handling HTTP requests in Node.js is to have a
        subroutine that collects all the data chunks belonging to the same
        request. These chunks are aggregated into a body variable.

        When the req.on('end') event is emitted, it signifies that all data from
        the request has been received. Typically, this data is in the form of a
        string. To work with this data in a structured format, it is often parsed
        into a JSON object using JSON.parse(body), provided the data is in JSON
        format.

        Our nodes expect data in JSON format.
    */
      // let body = [];
      let serialized_msg = '';
      req.on('data', (chunk) => {
        serialized_msg += chunk;
      });

      req.on('end', () => {

        /* Here, you can handle the service requests.
        Use the local routes service to get the service you need to call.
        You need to call the service with the method and arguments provided in the request.
        Then, you need to serialize the result and send it back to the caller.
        */
       let message = deserialize(serialized_msg);
        const configuration = {service: service, gid: gid};
        global.distribution.local.routes.get(configuration, (e, v) => {
          if (e) {
            res.end(serialize([e, null]));
          } else {
            const f = v[method];
            if (f === undefined) {
              res.end(serialize([new Error("Invalid key"), null]));
            } else {
              f(...message, (e, v) => {
                res.end(serialize([e, v]));
              });
            }
          }
        });
      });
    } else {
      res.end("NO");
    }
  });


  /*
    Your server will be listening on the port and ip specified in the config
    You'll be calling the `callback` callback when your server has successfully
    started.

    At some point, we'll be adding the ability to stop a node
    remotely through the service interface.
  */

  server.listen(global.nodeConfig.port, global.nodeConfig.ip, () => {
    log(`Server running at http://${global.nodeConfig.ip}:${global.nodeConfig.port}/`);
    global.distribution.node.server = server;
    callback(server);
  });

  server.on('error', (error) => {
    // server.close();
    log(`Server error: ${error}`);
    throw error;
  });
};

module.exports = {
  start: start,
};
