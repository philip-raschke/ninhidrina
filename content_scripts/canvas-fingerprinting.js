function canvasFingerprinting() {
	var standardToBlob = HTMLCanvasElement.prototype.toBlob;
	var standardToDataURL = HTMLCanvasElement.prototype.toDataURL;
	var standardGetImageData = CanvasRenderingContext2D.prototype.getImageData;

  var standardCreateElement = Document.prototype.createElement;
  var standardCreateElementNS = Document.prototype.createElementNS;
  var standardGetElementById = Document.prototype.getElementById;
  var standardGetElementsByName = Document.prototype.getElementsByName;
  var standardGetElementsByClassName = Document.prototype.getElementsByClassName;
  var standardGetElementsByTagName = Document.prototype.getElementsByTagName;
  var standardGetElementsByTagNameNS = Document.prototype.getElementsByTagNameNS;

  var originalCanvasMethods = [
    standardToBlob,
    standardToDataURL,
    standardGetImageData
  ];
  var canvasMethodsToOverride = [
    "toBlob",
    "toDataURL",
    "getImageData"
  ];

  var originalDocumentMethods = [
    standardCreateElement,
    standardCreateElementNS,
    standardGetElementById,
    standardGetElementsByName,
    standardGetElementsByClassName,
    standardGetElementsByTagName,
    standardGetElementsByTagNameNS
  ];
  var documentMethodsToOverride = [
    "createElement",
    "createElementNS",
    "getElementById",
    "getElementsByName",
    "getElementsByClassName",
    "getElementsByTagName",
    "getElementsByTagNameNS"
  ];

  overrideDocumentMethods();
  overrideCanvasMethods(null);

  function overrideCanvasMethods(element) {
    for (var i=0; i < canvasMethodsToOverride.length; i++) {
      var root;
      if (canvasMethodsToOverride[i] === "getImageData") {
        if (element === null) {
          root = CanvasRenderingContext2D;
        } else {
					try {
						root = element.CanvasRenderingContext2D;
					} catch (err) {
						emitAccessError("error, no access to iframe");
						return;
					}
        }
      } else {
        if (element === null) {
          root = HTMLCanvasElement;
        } else {
					try {
						root = element.HTMLCanvasElement;
					} catch (err) {
						emitAccessError("error, no access to iframe");
						return;
					}
        }
      }

      overrideCanvasMethod(i);
    }

    function overrideCanvasMethod(loopIndex) {
      Object.defineProperty(root.prototype, canvasMethodsToOverride[loopIndex], {
        value: function () {
          var width;
          var height;
          var context;
          var imageData;

          if (canvasMethodsToOverride[loopIndex] !== "getImageData") {
            width = this.width;
            height = this.height;
            context = this.getContext("2d");
            try {
              imageData = context.getImageData(0, 0, width, height);
            } catch (err) {
              return "";
            }
          } else {
            imageData = standardGetImageData.apply(this, arguments);
            width = imageData.width;
            height = imageData.height;
          }

					var image = imageData;

					var e = new Error();
				  var stack = e.stack.split("    ");
					var script = "";
					if (stack[1].indexOf("CanvasRenderingContext2D.value") !== -1) {
						if (stack[2].indexOf("HTMLCanvasElement.value") !== -1) {
							var arr = stack[3].split("(");
							script = arr[arr.length-1].split(")")[0];
						} else {
							var arr = stack[2].split("(");
							script = arr[arr.length-1].split(")")[0];
						}
					} else if (stack[1].indexOf("HTMLCanvasElement.value") !== -1) {
						var arr = stack[2].split("(");
						script = arr[arr.length-1].split(")")[0];
					}
					script = script.split(":")[0] + ":" + script.split(":")[1];

					emitFingerprint(image, script, e.stack);

          if (canvasMethodsToOverride[loopIndex] !== "getImageData") {
            context.putImageData(imageData, 0, 0);
            return originalCanvasMethods[loopIndex].apply(this, arguments);
          } else {
            return imageData;
          }
        }
      });
    }
  }

  function overrideDocumentMethods() {
    for (var i=0; i < documentMethodsToOverride.length; i++) {
      overrideDocumentMethod(i);
    }

    function overrideDocumentMethod(loopIndex) {
      Object.defineProperty(Document.prototype, documentMethodsToOverride[loopIndex], {
        value: function () {
          var element = originalDocumentMethods[loopIndex].apply(this, arguments);
          if (element === null) {
            return null;
          }

          if (Object.prototype.toString.call(element) === "[object HTMLCollection]" ||
            Object.prototype.toString.call(element) === "[object NodeList]") {
            for (var j=0; j < element.length; j++) {
              inject(element[j]);
            }
          } else {
            inject(element);
          }
          return element;
        }
      });
    }
  }

  function inject(element) {
    if (element.tagName.toUpperCase() === "IFRAME" && element.contentWindow) {
      overrideCanvasMethods(element.contentWindow);
    }
  }

	function emitFingerprint(imageData, script, stack) {
		window.dispatchEvent(new CustomEvent("fingerprint", {detail: {image: imageData, script: script, stack: stack}}));
	}

	function emitAccessError(message) {
		window.dispatchEvent(new CustomEvent("accessError", {detail: message}));
	}
}

window.addEventListener("fingerprint", function (fingerprint) {
	chrome.runtime.sendMessage({
		data: Array.from(fingerprint.detail.image.data),
		width: fingerprint.detail.image.width,
		height: fingerprint.detail.image.height,
		script: fingerprint.detail.script,
		stack: fingerprint.detail.stack
	});
});

window.addEventListener("accessError", function (message) {
	chrome.runtime.sendMessage({
		message: message.detail,
		iframeContent: message.currentTarget.elem.parentNode.outerHTML
	});
});
