var elem = document.createElement("script");
var code = document.createTextNode(
  canvasFingerprinting + "\r\n" +
  bootstrap + "\r\n" +
  "bootstrap();"
);
elem.appendChild(code);
var node = (document.documentElement || document.head || document.body);
node.insertBefore(elem, node.firstChild);

function bootstrap() {
  canvasFingerprinting();
}
