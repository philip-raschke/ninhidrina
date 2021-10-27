var container = document.getElementById("container");

var arr = [];
chrome.tabs.query({active: true, currentWindow: true}, function(tab) {
  chrome.runtime.sendMessage({request: tab[0].windowId + "_" + tab[0].id}, function (response) {
    if (!response.hasOwnProperty("array")) {
      return;
    }

    if (response.array.length > 0) {
      container.innerHTML = "";
    }

    for (var i=0; i < response.array.length; i++) {
      if (arr.indexOf(response.array[i].image) === -1) {
        arr.push(response.array[i].image);

        var li = document.createElement("li");
        li.className = "collection-item";

        var span = document.createElement("span");
        span.className = "title";

        var img = document.createElement("img");
        img.src = response.array[i].image;
        img.style.border = "1px solid Gainsboro";
        span.appendChild(img);

        var b = document.createElement("p");
        b.innerHTML = "<b>Original size: </b>" + response.array[i].width + " x " + response.array[i].height + " pixels";
        span.appendChild(b);

        li.appendChild(span);

        var p = document.createElement("p");
        var a = document.createElement("a");
        a.href = response.array[i].script;
        a.title = response.array[i].stack.replace("Error", "Generated: ").replace(/    /g, "\r\n- ");;
        a.target = "_blank";
        a.innerHTML = a.href;
        p.innerHTML = "<b>By script: </b>";
        p.style.cursor = "pointer";
        p.appendChild(a);

        li.appendChild(p);
        container.appendChild(li);
      }
    }
  });
});

function createImgElement(image) {
	var imgElement = window.document.createElement("img");
	imgElement.src = image;
	return imgElement;
}

document.getElementById("moreBtn").addEventListener("click", function(e) {
  chrome.tabs.create({url: chrome.extension.getURL("fingerprints_page/fingerprints.html")});
});
