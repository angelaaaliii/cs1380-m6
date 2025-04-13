/*
    In this file, add your own test case that will confirm your correct implementation of the extra-credit functionality.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/
jest.setTimeout(1000000);
const distribution = require('../../config.js');
const id = distribution.util.id;
const fs = require('fs');
const {execSync} = require('child_process');
const { deserialize, serialize } = require('../../distribution/util/util.js');

const crawlGroup = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7111};
const n2 = {ip: '127.0.0.1', port: 7112};
const n3 = {ip: '127.0.0.1', port: 7113};

// test('(15 pts) add support for iterative map-reduce', (done) => {
//   const original_url = "https://en.wikipedia.org/wiki/Josh_Schache";

//   execSync(`curl -skL --compressed "${original_url}" -o "raw_page.txt"`, { encoding: 'utf-8' });
//   const pageText = execSync(`./non-distribution/c/getText.js < raw_page.txt`, {encoding: 'utf-8'}).trim();
//   const res = {};
//   res['original_url'] = original_url;
//   res['page_text'] = pageText;
//   const arg1 = {"key": "httpsenwikipediaorgwikiJoshSchache", gid: "gid"};
//   const serialized_pg = serialize([arg1, res]);
//   const deserialized = deserialize(serialized_pg);
//   expect(serialize(deserialized)).toBe(serialized_pg);
//   done();
// });


test('(15 pts) add support for iterative map-reduce', (done) => {
  const mapper = (key, value, execArg) => {
    const original_url = value['original_url'];
    try {
      // has been visited before
      execArg(`grep -Fq "${original_url}" "visited.txt"`, {encoding: 'utf-8'});
      return [];
    } catch (e) {
      // not in visited
      try {
        execArg(`curl -skL --compressed "${original_url}" -o "raw_page.txt"`, { encoding: 'utf-8' });
        // const rawPgContent = execArg(`curl -skL --compressed "${original_url}"`, {encoding: 'utf-8'}).toString().trim();


        // let urls = [
        //   // "https://en.wikipedia.org/wiki/Schache",
        //   // "https://en.wikipedia.org/wiki/Help:Introduction",
        //   // "https://en.wikipedia.org/wiki/Category:Surnames",
        //   // "https://en.wikipedia.org/wiki/Anja_Schache",
        //   // "https://en.wikipedia.org/wiki/Help:Category",
        //   // "https://en.wikipedia.org/wiki/Laurence_Schache",
        //   // "https://en.wikipedia.org/wiki/Category:All_set_index_articles", 
        //   // "https://en.wikipedia.org/wiki/Help:Contents",
        //   // "https://en.wikipedia.org/wiki/Portal:Current_events",
        //   // "https://en.wikipedia.org/wiki/Category:Articles_with_short_description",
        //   // "https://en.wikipedia.org/wiki/Josh_Schache",
        //   // "https://en.wikipedia.org/wiki/Category:Short_description_is_different_from_Wikidata",
        //   // "https://en.wikipedia.org/wiki/Special:MyContributions",
        //   // "https://en.wikipedia.org/wiki/Special:MyTalk",
        //   "https://en.wikipedia.org/wiki/Given_name",
        //   // "https://en.wikipedia.org/wiki/Special:RecentChanges",
        //   "https://en.wikipedia.org/wiki/Main_Page", // ^ uncomment
        //   "https://en.wikipedia.org/wiki/Special:SpecialPages",
        //   "https://en.wikipedia.org/wiki/Special:RecentChangesLinked/Schache",
        //   "https://en.wikipedia.org/wiki/Special:Random",
        //   "https://en.wikipedia.org/wiki/Special:WhatLinksHere/Schache",
        //   "https://en.wikipedia.org/wiki/Surname",
        //   "https://en.wikipedia.org/wiki/Special:Search",
        //   "https://en.wikipedia.org/wiki/Talk:Schache",
        //   "https://en.wikipedia.org/wiki/Wikipedia:About",
        //   "https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License",
        //   "https://en.wikipedia.org/wiki/Wikipedia:File_upload_wizard",
        //   "https://en.wikipedia.org/wiki/Wikipedia:Community_portal",
        //   "https://en.wikipedia.org/wiki/Wikipedia:Contents",
        //   "https://en.wikipedia.org/wiki/Wikipedia:General_disclaimer",
        //   "https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Linking"
        // ];


        let urls = execArg(`./non-distribution/c/getURLs.js "https://en.wikipedia.org" < raw_page.txt`, { encoding: 'utf-8' }).toString();
        urls = urls.split('\n');
      
        const pageText = execArg(`./non-distribution/c/getText.js < raw_page.txt`, {encoding: 'utf-8'}).trim();

        value['page_text'] = pageText;


        let res = [];
  
        const inputKV = {};
        inputKV[key] = value;
        res.push(inputKV);
        execArg(`echo "${original_url}" >> visited.txt`, {encoding: 'utf-8'});
        for (let url of urls) {
          if (url == '') {
            continue;
          }
          try {
            // has been visited before
            execArg(`grep -Fq "${url}" "visited.txt"`, {encoding: 'utf-8'});
            continue;
          } catch (e) {
            // not been visited before
            const out = {};
            out[url] = {'original_url': url}; 
            res.push(out);
          }
        }
        return res;
      }
      catch (e) {
        return [];
      }
    }

 
  };
  
  const reducer = (key, values) => {
    const res = {};
    res[key] = values[0];
    return res;
  };

  
  const dataset = [
    // {"https://en.wikipedia.org/wiki/Laurence_Schache": {"original_url": "https://en.wikipedia.org/wiki/Laurence_Schache"}}
    {"https://en.wikipedia.org/wiki/Schache": {"original_url": "https://en.wikipedia.org/wiki/Schache"}}
    // {"https://en.wikipedia.org/wiki/Wikipedia:April_Fools": {"original_url": "https://en.wikipedia.org/wiki/Wikipedia:April_Fools"}}
    // {"https://en.wikipedia.org/wiki/Apple": {"original_url": "https://en.wikipedia.org/wiki/Apple"}}
  ];
  
    const doMapReduce = (cb) => {
      distribution.crawl.store.get(null, (e, v) => {
        distribution.crawl.mr.exec({keys: v, map: mapper, reduce: reducer, rounds: 2, out: "CRAWL_TEST", mapInGid: 'crawl', mapOutGid: 'mapOutReduceIn', reduceOutGid: 'reduceOut'}, (e, v) => {
          try {
            expect(e).toBe(null);

            // let url = "httpsenwikipediaorgwikiLaurenceSchache";
            // distribution["CRAWL_TEST"].store.get(url, (e, v) => {
            //   expect(e).toBe(null);
            //   expect(v.original_url).toBeDefined();
            //   expect(v.page_text).toBeDefined();
              
            //   let url = "httpsenwikipediaorgwikiLaurenceSchache";
            //   distribution["CRAWL_TEST"].store.get(url, (e, v) => {
            //     expect(e).toBe(null);
            //     expect(v.original_url).toBeDefined();
            //     expect(v.page_text).toBeDefined();
            //     done();
            //   });
            // });
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    };
  
    let cntr = 0;
  
    // Send the dataset to the cluster
    dataset.forEach((o) => {
      const key = Object.keys(o)[0];
      const value = o[key];
      distribution.crawl.store.put(value, key, (e, v) => {
        cntr++;
        // Once the dataset is in place, run the map reduce
        if (cntr === dataset.length) {
          doMapReduce();
        }
      });
    });
});

// test('(15 pts) add support for iterative map-reduce', (done) => {
//   const mapper = (key, value, execArg) => {
//     const original_url = value['original_url'];
//     try {
//       // has been visited before
//       execArg(`grep -Fq "${original_url}" "visited.txt"`, {encoding: 'utf-8'});
//       return [];
//     } catch (e) {
//       // not in visited
//       try {
//         execArg(`curl -skL --compressed "${original_url}" -o "raw_page.txt"`, { encoding: 'utf-8' });
//         // const rawPgContent = execArg(`curl -skL --compressed "${original_url}"`, {encoding: 'utf-8'}).toString().trim();


//         // let urls = [
//         //   // "https://en.wikipedia.org/wiki/Schache",
//         //   // "https://en.wikipedia.org/wiki/Help:Introduction",
//         //   // "https://en.wikipedia.org/wiki/Category:Surnames",
//         //   // "https://en.wikipedia.org/wiki/Anja_Schache",
//         //   // "https://en.wikipedia.org/wiki/Help:Category",
//         //   // "https://en.wikipedia.org/wiki/Laurence_Schache",
//         //   // "https://en.wikipedia.org/wiki/Category:All_set_index_articles", 
//         //   // "https://en.wikipedia.org/wiki/Help:Contents",
//         //   // "https://en.wikipedia.org/wiki/Portal:Current_events",
//         //   // "https://en.wikipedia.org/wiki/Category:Articles_with_short_description",
//         //   // "https://en.wikipedia.org/wiki/Josh_Schache",
//         //   // "https://en.wikipedia.org/wiki/Category:Short_description_is_different_from_Wikidata",
//         //   // "https://en.wikipedia.org/wiki/Special:MyContributions",
//         //   // "https://en.wikipedia.org/wiki/Special:MyTalk",
//         //   "https://en.wikipedia.org/wiki/Given_name",
//         //   // "https://en.wikipedia.org/wiki/Special:RecentChanges",
//         //   "https://en.wikipedia.org/wiki/Main_Page", // ^ uncomment
//         //   "https://en.wikipedia.org/wiki/Special:SpecialPages",
//         //   "https://en.wikipedia.org/wiki/Special:RecentChangesLinked/Schache",
//         //   "https://en.wikipedia.org/wiki/Special:Random",
//         //   "https://en.wikipedia.org/wiki/Special:WhatLinksHere/Schache",
//         //   "https://en.wikipedia.org/wiki/Surname",
//         //   "https://en.wikipedia.org/wiki/Special:Search",
//         //   "https://en.wikipedia.org/wiki/Talk:Schache",
//         //   "https://en.wikipedia.org/wiki/Wikipedia:About",
//         //   "https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License",
//         //   "https://en.wikipedia.org/wiki/Wikipedia:File_upload_wizard",
//         //   "https://en.wikipedia.org/wiki/Wikipedia:Community_portal",
//         //   "https://en.wikipedia.org/wiki/Wikipedia:Contents",
//         //   "https://en.wikipedia.org/wiki/Wikipedia:General_disclaimer",
//         //   "https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Linking"
//         // ];


//         let urls = execArg(`./non-distribution/c/getURLs.js "https://en.wikipedia.org" < raw_page.txt`, { encoding: 'utf-8' }).toString();
//         urls = urls.split('\n');
      
//         const pageText = execArg(`./non-distribution/c/getText.js < raw_page.txt`, {encoding: 'utf-8'}).trim();

//         value['page_text'] = pageText;


//         let res = [];
  
//         const inputKV = {};
//         inputKV[key] = value;
//         res.push(inputKV);
//         execArg(`echo "${original_url}" >> visited.txt`, {encoding: 'utf-8'});
//         for (let url of urls) {
//           if (url == '') {
//             continue;
//           }
//           try {
//             // has been visited before
//             execArg(`grep -Fq "${url}" "visited.txt"`, {encoding: 'utf-8'});
//             continue;
//           } catch (e) {
//             // not been visited before
//             const out = {};
//             out[url] = {'original_url': url}; 
//             res.push(out);
//           }
//         }
//         return res;
//       }
//       catch (e) {
//         return [];
//       }
//     }

 
//   };
  
//   const reducer = (key, values) => {
//     const res = {};
//     res[key] = values[0];
//     return res;
//   };

  
//   const dataset = [
//     // {"https://en.wikipedia.org/wiki/Laurence_Schache": {"original_url": "https://en.wikipedia.org/wiki/Laurence_Schache"}}
//     {"https://en.wikipedia.org/wiki/Schache": {"original_url": "https://en.wikipedia.org/wiki/Schache"}}
//     // {"https://en.wikipedia.org/wiki/Wikipedia:April_Fools": {"original_url": "https://en.wikipedia.org/wiki/Wikipedia:April_Fools"}}
//     // {"https://en.wikipedia.org/wiki/Apple": {"original_url": "https://en.wikipedia.org/wiki/Apple"}}
//   ];
  
//     const doMapReduce = (cb) => {
//       distribution.crawl.store.get(null, (e, v) => {
//         distribution.crawl.mr.exec({keys: v, map: mapper, reduce: reducer, rounds: 2, out: "CRAWL_TEST"}, (e, v) => {
//           try {
//             expect(e).toBe(null);

//             // let url = "httpsenwikipediaorgwikiLaurenceSchache";
//             // distribution["CRAWL_TEST"].store.get(url, (e, v) => {
//             //   expect(e).toBe(null);
//             //   expect(v.original_url).toBeDefined();
//             //   expect(v.page_text).toBeDefined();
              
//             //   let url = "httpsenwikipediaorgwikiLaurenceSchache";
//             //   distribution["CRAWL_TEST"].store.get(url, (e, v) => {
//             //     expect(e).toBe(null);
//             //     expect(v.original_url).toBeDefined();
//             //     expect(v.page_text).toBeDefined();
//             //     done();
//             //   });
//             // });
//             done();
//           } catch (e) {
//             done(e);
//           }
//         });
//       });
//     };
  
//     let cntr = 0;
  
//     // Send the dataset to the cluster
//     dataset.forEach((o) => {
//       const key = Object.keys(o)[0];
//       const value = o[key];
//       distribution.crawl.store.put(value, key, (e, v) => {
//         cntr++;
//         // Once the dataset is in place, run the map reduce
//         if (cntr === dataset.length) {
//           doMapReduce();
//         }
//       });
//     });
// });

test.only('for loop', (done) => {
  // const mapper = (key, value, execArg) => {
  //   const original_url = value['original_url'];
  //   try {
  //     // has been visited before
  //     execArg(`grep -Fq "${original_url}" "visited.txt"`, {encoding: 'utf-8'});
  //     return [];
  //   } catch (e) {
  //     // not in visited
  //     try {
  //       execArg(`curl -skL --compressed "${original_url}" -o "raw_page.txt"`, { encoding: 'utf-8' });


  //       let urls = [
  //         "https://en.wikipedia.org/wiki/Schache",
  //         "https://en.wikipedia.org/wiki/Help:Introduction",
  //         "https://en.wikipedia.org/wiki/Category:Surnames",
  //         "https://en.wikipedia.org/wiki/Anja_Schache",
  //         "https://en.wikipedia.org/wiki/Help:Category",
  //         "https://en.wikipedia.org/wiki/Laurence_Schache",
  //         "https://en.wikipedia.org/wiki/Category:All_set_index_articles", 
  //         "https://en.wikipedia.org/wiki/Help:Contents",
  //         "https://en.wikipedia.org/wiki/Portal:Current_events",
  //         "https://en.wikipedia.org/wiki/Category:Articles_with_short_description",
  //         "https://en.wikipedia.org/wiki/Josh_Schache",
  //         "https://en.wikipedia.org/wiki/Category:Short_description_is_different_from_Wikidata",
  //         "https://en.wikipedia.org/wiki/Special:MyContributions",
  //         "https://en.wikipedia.org/wiki/Special:MyTalk",
  //         "https://en.wikipedia.org/wiki/Given_name",
  //         "https://en.wikipedia.org/wiki/Special:RecentChanges",
  //         "https://en.wikipedia.org/wiki/Main_Page", // ^ uncomment
  //         "https://en.wikipedia.org/wiki/Special:SpecialPages",
  //         "https://en.wikipedia.org/wiki/Special:RecentChangesLinked/Schache",
  //         "https://en.wikipedia.org/wiki/Special:Random",
  //         "https://en.wikipedia.org/wiki/Special:WhatLinksHere/Schache",
  //         "https://en.wikipedia.org/wiki/Surname",
  //         "https://en.wikipedia.org/wiki/Special:Search",
  //         "https://en.wikipedia.org/wiki/Talk:Schache",
  //         "https://en.wikipedia.org/wiki/Wikipedia:About",
  //         "https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License",
  //         "https://en.wikipedia.org/wiki/Wikipedia:File_upload_wizard",
  //         "https://en.wikipedia.org/wiki/Wikipedia:Community_portal",
  //         "https://en.wikipedia.org/wiki/Wikipedia:Contents",
  //         "https://en.wikipedia.org/wiki/Wikipedia:General_disclaimer",
  //         "https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Linking"
  //       ];

  //       // let urls = [];
  //       // let urls = execArg(`./non-distribution/c/getURLs.js "https://en.wikipedia.org" < raw_page.txt`, { encoding: 'utf-8' }).toString();
  //       // urls = urls.split('\n');
      
  //       const pageText = execArg(`./non-distribution/c/getText.js < raw_page.txt`, {encoding: 'utf-8'}).trim();
  //       value['page_text'] = pageText;


  //       let res = [];
  //       const inputKV = {};
  //       inputKV[key] = value;
  //       res.push(inputKV);
  //       execArg(`echo "${original_url}" >> visited.txt`, {encoding: 'utf-8'});
  //       for (let url of urls) {
  //         if (url == '') {
  //           continue;
  //         }
  //         try {
  //           // has been visited before
  //           execArg(`grep -Fq "${url}" "visited.txt"`, {encoding: 'utf-8'});
  //           continue;
  //         } catch (e) {
  //           // not been visited before
  //           const out = {};
  //           out[url] = {'original_url': url}; 
  //           res.push(out);
  //         }
  //       }
  //       return res;
  //     }
  //     catch (e) {
  //       return [];
  //     }
  //   }

 
  // };
  

  const mapper = (key, value, execArg) => {
    const original_url = value['original_url'];
    value['page_text'] = 'hi';


    let res = [];
    const inputKV = {};
    inputKV[key] = value;
    res.push(inputKV);

    return res;
  };


  const reducer = (key, values) => {
    const res = {};
    res[key] = values[0];
    return res;
  };

  
  const dataset = [
    // {"https://en.wikipedia.org/wiki/Laurence_Schache": {"original_url": "https://en.wikipedia.org/wiki/Laurence_Schache"}}
    {"https://en.wikipedia.org/wiki/Schache": {"original_url": "https://en.wikipedia.org/wiki/Schache"}}
    // {"https://en.wikipedia.org/wiki/Wikipedia:April_Fools": {"original_url": "https://en.wikipedia.org/wiki/Wikipedia:April_Fools"}}
    // {"https://en.wikipedia.org/wiki/Apple": {"original_url": "https://en.wikipedia.org/wiki/Apple"}}
  ];
  
  const doMapReduce = async (cb) => {
      const maxIterations = 1;
      try {
        let res;
        let mapInGid = 'crawl';
        for (let i = 1; i <= maxIterations; i++) {
          let mapOutGid = i + '_mapOut';
          let reduceOutGid = i + '_reduceOut';
          res = await new Promise((resolve, reject) => {
            // distribution.crawl.mr.exec(
            //   { map: mapper, reduce: reducer, rounds: 1, out: maxIterations + "_CRAWL_TEST", mapInGid: mapInGid, mapOutGid: mapOutGid, reduceOutGid: reduceOutGid },
            //   (e, v) => {
            //     if (e) return reject(e);
            //     mapInGid = v;
            //     resolve( v );
            //   }
            // );
            distribution.crawl.mr.exec(
              { map: mapper, reduce: reducer, rounds: 1, out: "2_CRAWL_TEST", mapInGid: "1_reduceOut", mapOutGid: "2_mapOut", reduceOutGid: "2_reduceOut" },
              (e, v) => {
                if (e) return reject(e);
                mapInGid = v;
                resolve( v );
              }
            );
          });
        }
    
        // Final checks (after last iteration)
        // Uncomment and adapt the URL if needed
        // let url = "httpsenwikipediaorgwikiLaurenceSchache";
        // const value = await new Promise((resolve, reject) => {
        //   distribution["CRAWL_TEST"].store.get(url, (e, v) => {
        //     if (e) return reject(e);
        //     resolve(v);
        //   });
        // });
        // expect(value.original_url).toBeDefined();
        // expect(value.page_text).toBeDefined();

        expect(res).toBe('2_reduceOut');
        done(); // Only call done if all went well
      } catch (e) {
        done(e); // Fail the test if anything threw an error
      }
  };
  
  let cntr = 0;
  
  // Send the dataset to the cluster
  dataset.forEach((o) => {
      const key = Object.keys(o)[0];
      const value = o[key];
      distribution.crawl.store.put(value, key, (e, v) => {
        cntr++;
        // Once the dataset is in place, run the map reduce
        if (cntr === dataset.length) {
          doMapReduce();
        }
      });
  });
});

test('deserialize', (done) => {
try {
  const obj = {original_url: "https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License"};
  const serialized = serialize(obj);
  console.log(serialized);
  const content = deserialize(serialized);
  done();
} catch (e) {
  console.log(e);
  done();
}
});

beforeAll((done) => {
    crawlGroup[id.getSID(n1)] = n1;
    // crawlGroup[id.getSID(n2)] = n2;
    // crawlGroup[id.getSID(n3)] = n3;

    fs.writeFileSync("visited.txt", "\n");

  
    const startNodes = (cb) => {
      distribution.local.status.spawn(n1, (e, v) => {
        // distribution.local.status.spawn(n2, (e, v) => {
          // distribution.local.status.spawn(n3, (e, v) => {
            cb();
        //   });
        // });
      });
    };
  
    distribution.node.start((server) => {
      localServer = server;
  

      startNodes(() => {
        const crawlConfig = {gid: 'crawl'};
        distribution.local.groups.put(crawlConfig, crawlGroup, (e, v) => {
          distribution.crawl.groups.put(crawlConfig, crawlGroup, (e, v) => {
            done();
          });
        });
      });
    });
  });
  
afterAll((done) => {
  const remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    // remote.node = n2;
    // distribution.local.comm.send([], remote, (e, v) => {
    //   remote.node = n3;
    //   distribution.local.comm.send([], remote, (e, v) => {
        localServer.close();
        done();
    //   });
    // });
  });
});