const distribution = require('../config.js');
const id = distribution.util.id;

test('(2 pts) local.groups.get(random)', (done) => {
  distribution.local.groups.get('random', (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) local.groups.del(random)', (done) => {
  distribution.local.groups.del('random', (e, v) => {
    try {
      expect(e).toBeDefined();
      expect(e).toBeInstanceOf(Error);
      expect(v).toBeFalsy();
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) local.groups.put(browncs)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.local.groups.put('browncs', g, (e, v) => {
    try {
      expect(e).toBeFalsy();
      expect(v).toBe(g);
      done();
    } catch (error) {
      done(error);
    }
  });
});

test('(2 pts) local.groups.put/get(browncs)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.local.groups.put('browncs', g, (e, v) => {
    distribution.local.groups.get('browncs', (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toBe(g);
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});

test('(2 pts) local.groups.put/get/del(browncs)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.local.groups.put('browncs', g, (e, v) => {
    distribution.local.groups.get('browncs', (e, v) => {
      distribution.local.groups.del('browncs', (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toBe(g);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

test('(2 pts) local.groups.put/get/del/get(browncs)', (done) => {
  let g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.local.groups.put('browncs', g, (e, v) => {
    distribution.local.groups.get('browncs', (e, v) => {
      distribution.local.groups.del('browncs', (e, v) => {
        distribution.local.groups.get('browncs', (e, v) => {
          try {
            expect(e).toBeDefined();
            expect(e).toBeInstanceOf(Error);
            expect(v).toBeFalsy();
            done();
          } catch (error) {
            done(error);
          }
        });
      });
    });
  });
});

test('(2 pts) local.groups.put(dummy)/add(n1)/get(dummy)', (done) => {
  const g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.local.groups.put('dummy', g, (e, v) => {
    const n1 = {ip: '127.0.0.1', port: 8082};

    distribution.local.groups.add('dummy', n1, (e, v) => {
      const expectedGroup = {
        ...g, ...{[id.getSID(n1)]: n1},
      };

      distribution.local.groups.get('dummy', (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(expectedGroup);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

test('(2 pts) local.groups.put(dummy)/rem(n1)/get(dummy)', (done) => {
  const g = {
    '507aa': {ip: '127.0.0.1', port: 8080},
    '12ab0': {ip: '127.0.0.1', port: 8081},
  };

  distribution.local.groups.put('dummy', g, (e, v) => {
    distribution.local.groups.rem('dummy', '507aa', (e, v) => {
      const expectedGroup = {
        '12ab0': {ip: '127.0.0.1', port: 8081},
      };

      distribution.local.groups.get('dummy', (e, v) => {
        try {
          expect(e).toBeFalsy();
          expect(v).toEqual(expectedGroup);
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
});

