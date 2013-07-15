/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */

var path = require("path"),
    fs = require("fs"),
    util = require("./util"),
    WebVTTParser = require("../").WebVTTParser,
    FakeWindow = require("./util/fake-window.js");

function parseTestList(testListPath) {
  var testArgs = fs.readFileSync(testListPath, "utf8").split("\n"),
      dirPath = testListPath.substr(0, testListPath.indexOf("/test.list")),
      testList = {
        tests: [],
        includes: []
      };

  // Loop through the each line. If we successfully parse an argument line add
  // the resulting test information to the list.
  for (var i = 0; i < testArgs.length; i++) {
    var argData = testArgs[i].split(" ");

    // We only know how to parse two argument instructions right now.
    if (argData.length !== 2)
      continue;

    // Parse an include argument.
    if (argData[0] === "include" && argData[1].match(/[a-zA-Z-]+\/test.list/)) {
      testList.includes.push(path.join(dirPath, argData[1]));
      continue;
    }

    // All other arguments other than include must start with a .vtt file.
    if (!argData[0].match(/[a-zA-Z-]+\.vtt/))
      continue;

    // Currently we can only handle js or json files to test with.
    if(argData[1].match(/[a-zA-Z-]+\.js$/))
      testList.tests.push({
        vtt: path.join(dirPath, argData[0]),
        assertions: require(path.join(dirPath, argData[1]))
      });
    else if (argData[1].match(/[a-zA-Z-]+\.json$/))
      testList.tests.push({
        vtt: path.join(dirPath, argData[0]),
        expectedJson: require(path.join(dirPath, argData[1]))
      });
  }

  return testList;
}

function runTest(test) {

  // Set the parentNode value to unefined when trying to stringify the JSON.
  // Without this we will get a circular data structure which stringify will
  // not be able to handle.
  function filterJson(key, value) {
    if (key == "parentNode")
      return undefined;
    return value;
  }

  var assertions;
  if (test.expectedJson) {
    util.parseTest(test.vtt, function(vtt, t) {
      var json = test.expectedJson;
      t.deepEqual(vtt.cues[0], json.cue);
      t.equal(JSON.stringify(WebVTTParser.convertCueToDOMTree(new FakeWindow(),
                                                              vtt.cues[0]),
                                                              filterJson),
              JSON.stringify(json.domTree),
              "DOM tree should be equal.");
      t.end();
    });
    return true;
  } else if (test.assertions) {
    util.parseTest(test.vtt, test.assertions);
    return true;
  }

  return false;
}

function runTests(testListPath) {
  var testList = parseTestList(testListPath);

  for (var i = 0; i < testList.tests.length; i++)
    runTest(testList.tests[i]);

  if (testList.includes)
    for (var i = 0; i < testList.includes.length; i++)
      runTests(testList.includes[i]);
}

runTests(path.join(__dirname, "test.list"));
