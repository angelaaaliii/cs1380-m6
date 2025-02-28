
const gossip = {};
const seenMessages = new Set();

gossip.recv = function(payload="", callback=(e, v)=>{}) {
  if (payload in seenMessages) {
    callback(null, payload);
    return;
  } 
  seenMessages.add(payload);
  global.distribution.all.gossip.send(payload, remote, (e, v) => {
    callback(e, v);
  })
};

module.exports = gossip;
