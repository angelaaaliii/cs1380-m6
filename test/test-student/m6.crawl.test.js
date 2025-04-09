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

const crawlGroup = {};

/*
    The local node will be the orchestrator.
*/
let localServer = null;

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};

test('(15 pts) add support for iterative map-reduce', (done) => {
  const mapper = (key, value, execArg) => {
    const original_url = value['original_url'];
    try {
      // has been visited before
      const found = execArg(`grep -Fq "${original_url}" "visited.txt"`, {encoding: 'utf-8'});
      return [];
    } catch (e) {
      // not in visited
      try {
        execArg(`curl -skL --compressed "${original_url}" -o "raw_page.txt"`, { encoding: 'utf-8' });
        // const rawPgContent = execArg(`curl -skL --compressed "${original_url}"`, {encoding: 'utf-8'}).toString().trim();


        // let urls = [
        //   "https://en.wikipedia.org/wiki/Schache",
        //   "https://donate.wikimedia.org/?wmf_source=donate&wmf_medium=sidebar&wmf_campaign=en.wikipedia.org&uselang=en",
        //   "https://commons.wikimedia.org/wiki/Category:Schache_(surname)",
        //   "https://en.wikipedia.org/wiki/Help:Introduction",
        //   "https://developer.wikimedia.org/",
        //   "https://en.wikipedia.org/wiki/Anja_Schache",
        //   "https://en.wikipedia.org/wiki/Category:Surnames",
        //   "https://en.wikipedia.org/wiki/Laurence_Schache",
        //   "https://en.wikipedia.org/wiki/Category:All_set_index_articles",
        //   "https://en.wikipedia.org/wiki/Category:Articles_with_short_description",
        //   "https://en.wikipedia.org/wiki/Help:Category",
        //   "https://en.wikipedia.org/wiki/Category:Short_description_is_different_from_Wikidata",
        //   "https://en.wikipedia.org/wiki/Help:Contents",
        //   "https://en.wikipedia.org/wiki/Josh_Schache",
        //   "https://en.wikipedia.org/wiki/Special:MyTalk",
        //   "https://en.wikipedia.org/wiki/Special:RecentChangesLinked/Schache",
        //   "https://en.wikipedia.org/wiki/Given_name",
        //   "https://en.wikipedia.org/wiki/Portal:Current_events",
        //   "https://en.wikipedia.org/wiki/Main_Page",
        //   "https://en.wikipedia.org/wiki/Special:Random",
        //   "https://en.wikipedia.org/wiki/Special:Search",
        //   "https://en.wikipedia.org/wiki/Special:MyContributions",
        //   "https://en.wikipedia.org/wiki/Wikipedia:About",
        //   "https://en.wikipedia.org/wiki/Special:SpecialPages",
        //   "https://en.wikipedia.org/wiki/Special:WhatLinksHere/Schache",
        //   "https://en.wikipedia.org/wiki/Wikipedia:File_upload_wizard",
        //   "https://en.wikipedia.org/w/index.php?title=Schache&action=edit",
        //   "https://en.wikipedia.org/w/index.php?title=Schache&oldid=1280897215",
        //   "https://en.wikipedia.org/w/index.php?title=Schache&printable=yes",
        //   "https://en.wikipedia.org/w/index.php?title=Special:CreateAccount&returnto=Schache",
        //   "https://en.wikipedia.org/w/index.php?title=Special:UrlShortener&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FSchache",
        //   "https://en.wikipedia.org/w/index.php?title=Special:UserLogin&returnto=Schache",
        //   "https://foundation.wikimedia.org/wiki/Special:MyLanguage/Policy:Cookie_statement",
        //   "https://foundation.wikimedia.org/wiki/Special:MyLanguage/Policy:Universal_Code_of_Conduct",
        //   "https://stats.wikimedia.org/#/en.wikipedia.org",
        //   "https://www.wikidata.org/wiki/Special:EntityPage/Q55422415",
        //   "https://en.wikipedia.org/wiki/Surname",
        //   "https://en.wikipedia.org/wiki/Talk:Schache",
        //   "https://en.wikipedia.org/wiki/Wikipedia:Text_of_the_Creative_Commons_Attribution-ShareAlike_4.0_International_License",
        //   "https://en.wikipedia.org/w/index.php?title=Special:CiteThisPage&page=Schache&id=1280897215&wpFormIdentifier=titleform",
        //   "https://en.wikipedia.org/w/index.php?title=Special:WhatLinksHere/Schache&namespace=0",
        //   "https://wikimediafoundation.org/",
        //   "https://www.mediawiki.org/",
        //   "https://www.wikidata.org/wiki/Special:EntityPage/Q55422415#sitelinks-wikipedia",
        //   "https://en.wikipedia.org/wiki/Wikipedia:Community_portal",
        //   "https://en.wikipedia.org/wiki/Wikipedia:Contents",
        //   "https://en.wikipedia.org/wiki/Wikipedia:General_disclaimer",
        //   "https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Linking",
        //   "https://en.wikipedia.org/w/index.php?title=Schache&action=history",
        //   "https://en.wikipedia.org/w/index.php?title=Schache&action=info",
        //   "https://en.wikipedia.org/w/index.php?title=Special:DownloadAsPdf&page=Schache&action=show-download-screen",
        //   "https://en.wikipedia.org/w/index.php?title=Special:QrCode&url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FSchache",
        //   "https://foundation.wikimedia.org/wiki/Special:MyLanguage/Policy:Privacy_policy",
        //   "https://foundation.wikimedia.org/wiki/Special:MyLanguage/Policy:Terms_of_Use",
        //   "https://www.wikimedia.org/"
        // ];


        let urls = execArg(`./non-distribution/c/getURLs.js "https://en.wikipedia.org" < raw_page.txt`, { encoding: 'utf-8' }).toString();
        urls = urls.split('\n');
      
        const pageText = execArg(`./non-distribution/c/getText.js < raw_page.txt`, {encoding: 'utf-8'}).toString().trim();
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
            const found = execArg(`grep -Fq "${url}" "visited.txt"`, {encoding: 'utf-8'});
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
    {"https://en.wikipedia.org/wiki/Laurence_Schache": {"original_url": "https://en.wikipedia.org/wiki/Laurence_Schache"}}
    // {"https://en.wikipedia.org/wiki/Schache": {"original_url": "https://en.wikipedia.org/wiki/Schache"}}
    // {"https://en.wikipedia.org/wiki/Wikipedia:April_Fools": {"original_url": "https://en.wikipedia.org/wiki/Wikipedia:April_Fools"}}
    // {"https://en.wikipedia.org/wiki/Apple": {"original_url": "https://en.wikipedia.org/wiki/Apple"}}
  ];
  
    const doMapReduce = (cb) => {
      distribution.crawl.store.get(null, (e, v) => {
  
        distribution.crawl.mr.exec({keys: v, map: mapper, reduce: reducer, rounds: 2, out: "CRAWL_TEST"}, (e, v) => {
          try {
            expect(e).toBe(null);

            let url = "httpsenwikipediaorgwikiAnjaSchache";
            distribution["CRAWL_TEST"].store.get(url, (e, v) => {
              expect(e).toBe(null);
              expect(v.original_url).toBeDefined();
              expect(v.page_text).toBeDefined();
              
              let url = "httpsenwikipediaorgwikiLaurenceSchache";
              distribution["CRAWL_TEST"].store.get(url, (e, v) => {
                expect(e).toBe(null);
                expect(v.original_url).toBeDefined();
                expect(v.page_text).toBeDefined();
                done();
              });
            });
            done();
          } catch (e) {
            console.log(e);
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

beforeAll((done) => {
    crawlGroup[id.getSID(n1)] = n1;
    crawlGroup[id.getSID(n2)] = n2;
    crawlGroup[id.getSID(n3)] = n3;

    fs.writeFileSync("visited.txt", "\n");

  
    const startNodes = (cb) => {
      distribution.local.status.spawn(n1, (e, v) => {
        distribution.local.status.spawn(n2, (e, v) => {
          distribution.local.status.spawn(n3, (e, v) => {
            cb();
          });
        });
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
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        localServer.close();
        done();
      });
    });
  });
});