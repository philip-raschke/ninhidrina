var fingerprints = {};
var fingerprintsToSet = [];

updateFPs();

function updateFPs() {
  setTimeout(updateFPs, 2500);

  if (fingerprintsToSet.length === 0) {
    return;
  }

  chrome.storage.local.get("fingerprints", function(result) {
    if (result.hasOwnProperty("fingerprints")) {
      chrome.storage.local.set({fingerprints: result.fingerprints.concat(fingerprintsToSet)});
    } else {
      chrome.storage.local.set({fingerprints: fingerprintsToSet});
    }
    fingerprintsToSet = [];
  });
}

chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  if (details.frameId === 0) {
    fingerprints[details.tabId] = [];
  }
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.hasOwnProperty("data")) {
    var image = getImageAsData(sender.url, message.data, message.width, message.height);
    var imgObject = {
      sender: sender.url,
      image: image,
      width: message.width,
      height: message.height,
      timestamp: Date.now(),
      script: message.script,
      stack: message.stack
    };
    fingerprintsToSet.push(imgObject);

    var tabName = sender.tab.windowId + "_" + sender.tab.id;
    if (typeof fingerprints[tabName] === "undefined") {
      fingerprints[tabName] = [];
    }
    fingerprints[tabName].push(imgObject);
    var tmp = [];
    for (var i=0; i < fingerprints[tabName].length; i++) {
      if (tmp.indexOf(fingerprints[tabName][i].image) === -1) {
        tmp.push(fingerprints[tabName][i].image);
      }
    }
    chrome.browserAction.setBadgeText({text: tmp.length + "", tabId: sender.tab.id});
    chrome.browserAction.setBadgeBackgroundColor({color: "#961e82", tabId: sender.tab.id});
  } else if (message.hasOwnProperty("request")) {
    sendResponse({array: fingerprints[message.request]});
  }
});

function getImageAsData(sender, data, width, height) {
  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext("2d");
  var imageData = ctx.createImageData(width, height);
  imageData.data.set(Uint8ClampedArray.from(data));
  ctx.putImageData(imageData, 0, 0);
  var image = canvas.toDataURL();
  return image;
}
