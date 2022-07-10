"use strict";

var socket;
var DRAW_CONSTS = {
  DEFAULT_LINE_WIDTH: 8,
  DEFAULT_STROKE_STYLE: "#ff0000",
  DEFAULT_LINE_CAP: "round",
  DEFAULT_LINE_JOIN: "round",
  DEFAULT_BACK_COLOR: "lightgray"
};
var drawController = {
  canvas: null,
  ctx: null,
  dragging: false,
  lineWidth: null,
  strokeStyle: null,
  strokeStart: {},
  previousMouseLocation: null,
  lockInput: false,
  colorWheel: {},
  changeLineWidth: function changeLineWidth(e) {
    drawController.lineWidth = e.target.value;
  },
  changeStrokeColor: function changeStrokeColor(e) {
    var hexColor = e.target.attributes[1].value;
    drawController.strokeStyle = hexColor;
  },
  clearServerDrawing: function clearServerDrawing(e) {
    socket.emit('clearDrawing');
  },
  clearLocalCanvas: function clearLocalCanvas(e) {
    drawController.ctx.clearRect(0, 0, drawController.ctx.canvas.width, drawController.ctx.canvas.height);
    fillBackground();
  },
  setToColorAtLocation: function setToColorAtLocation(location) {
    var pxData = drawController.ctx.getImageData(location.x, location.y, 1, 1);
    drawController.strokeStyle = "rgba(".concat(pxData.data[0], ", ").concat(pxData.data[1], ", ").concat(pxData.data[2], ", ").concat(pxData.data[3], ")");
    drawController.ctx.strokeStyle = drawController.strokeStyle;
    drawController.colorWheel.attributes[1].value = drawController.ctx.strokeStyle;
  },
  joinRoom: function joinRoom(e) {
    console.dir(e);
  }
};

var onKeyDown = function onKeyDown(e) {
  if (e.key === 'Alt') {
    e.preventDefault();
    document.body.style.cursor = "crosshair";
  }
};

var onKeyUp = function onKeyUp(e) {
  if (e.key === 'Alt') {
    e.preventDefault();
    document.body.style.cursor = "auto";
  }
};

var setupSocket = function setupSocket() {
  socket.on('pathToClient', drawPathFromServer);
  socket.on('initDrawing', function (data) {
    var drawingSteps = data.drawSteps;
    drawController.lockInput = true;

    for (var i = 0; i < drawingSteps.length; i++) {
      drawPathFromServer(drawingSteps[i]);
    }

    drawController.lockInput = false;
  });
  socket.on('clearDrawing', function (data) {
    drawController.clearLocalCanvas();
  });
};

var sendPathToServer = function sendPathToServer(mouseLocation) {
  var path = {
    start: drawController.strokeStart,
    end: mouseLocation,
    style: drawController.strokeStyle,
    width: drawController.lineWidth
  };
  socket.emit('pathToServer', path);
};

var drawPathFromServer = function drawPathFromServer(data) {
  drawController.ctx.save();
  drawController.ctx.beginPath();
  drawController.ctx.strokeStyle = data.style;
  drawController.ctx.lineWidth = data.width;
  drawController.ctx.moveTo(data.start.x, data.start.y);
  drawController.ctx.lineTo(data.end.x, data.end.y);
  drawController.ctx.stroke();
  drawController.ctx.restore();
};

var fillBackground = function fillBackground() {
  drawController.ctx.save();
  drawController.ctx.fillStyle = DRAW_CONSTS.DEFAULT_BACK_COLOR;
  drawController.ctx.fillRect(0, 0, drawController.ctx.canvas.width, drawController.ctx.canvas.height);
  drawController.ctx.restore();
};

var init = function init() {
  socket = io.connect({
    query: {
      room: 'room1'
    }
  });
  setupSocket();
  initDrawPage();
};

var initDrawPage = function initDrawPage() {
  reactModule.renderCanvas('content');
  reactModule.renderButtons('leftBar');
  reactModule.renderColorWheel('rightBar');
  reactModule.setupNavLinks();
  drawController.canvas = document.querySelector('#mainCanvas');
  drawController.ctx = drawController.canvas.getContext('2d');
  drawController.lineWidth = DRAW_CONSTS.DEFAULT_LINE_WIDTH;
  drawController.strokeStyle = DRAW_CONSTS.DEFAULT_STROKE_STYLE;
  drawController.ctx.lineWidth = drawController.lineWidth;
  drawController.ctx.strokeStyle = drawController.strokeStyle;
  drawController.ctx.lineCap = DRAW_CONSTS.DEFAULT_LINE_CAP;
  drawController.ctx.lineJoin = DRAW_CONSTS.DEFAULT_LINE_JOIN;
  drawController.ctx.canvas.style.touchAction = "none";
  fillBackground();
  drawController.colorWheel = document.querySelector('#colorWheel');
  drawController.colorWheel.onchange = drawController.changeStrokeColor;
  mouseController.setupMouseListeners(drawController);
  touchController.setupTouchListeners(drawController);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  var lineWidthSlider = document.querySelector('#lineWidth');
  lineWidthSlider.value = DRAW_CONSTS.DEFAULT_LINE_WIDTH;
  lineWidthSlider.onchange = drawController.changeLineWidth;
};

$(document).ready(function () {
  init();
});
"use strict";

var mouseController = {
  setupMouseListeners: function setupMouseListeners(drawController) {
    drawController.canvas.onmousedown = mouseController.mouseDown;
    drawController.canvas.onmousemove = mouseController.mouseMove;
    drawController.canvas.onmouseup = mouseController.mouseUp;
    drawController.canvas.onmouseout = mouseController.mouseOut;
  },
  getMouse: function getMouse(e) {
    var mouseLocation = {};
    mouseLocation.x = e.pageX - e.target.offsetLeft;
    mouseLocation.y = e.pageY - e.target.offsetTop;
    return mouseLocation;
  },
  mouseDown: function mouseDown(e) {
    if (drawController.lockInput) return;
    var mouseLocation = mouseController.getMouse(e);
    drawController.dragging = true;

    if (e.altKey) {
      drawController.setToColorAtLocation(mouseLocation);
      return;
    }

    drawController.ctx.moveTo(mouseLocation.x, mouseLocation.y);
    drawController.strokeStart.x = mouseLocation.x;
    drawController.strokeStart.y = mouseLocation.y;
  },
  mouseMove: function mouseMove(e) {
    if (!drawController.dragging || drawController.lockInput) return;
    var mouseLocation = mouseController.getMouse(e);

    if (e.altKey) {
      drawController.setToColorAtLocation(mouseLocation);
      return;
    }

    drawController.ctx.beginPath();
    drawController.ctx.moveTo(drawController.strokeStart.x, drawController.strokeStart.y);
    drawController.ctx.strokeStyle = drawController.strokeStyle;
    drawController.ctx.lineWidth = drawController.lineWidth;
    drawController.ctx.lineTo(mouseLocation.x, mouseLocation.y);
    drawController.ctx.stroke();
    sendPathToServer(mouseLocation);
    drawController.strokeStart.x = mouseLocation.x;
    drawController.strokeStart.y = mouseLocation.y;
  },
  mouseUp: function mouseUp(e) {
    drawController.dragging = false;
  },
  mouseOut: function mouseOut(e) {
    drawController.dragging = false;
  }
};
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var reactModule = {};

var Canvas = function (_React$Component) {
  _inherits(Canvas, _React$Component);

  var _super = _createSuper(Canvas);

  function Canvas() {
    _classCallCheck(this, Canvas);

    return _super.apply(this, arguments);
  }

  _createClass(Canvas, [{
    key: "render",
    value: function render() {
      return React.createElement("div", null, React.createElement("canvas", {
        id: "mainCanvas",
        width: 700,
        height: 500
      }));
    }
  }]);

  return Canvas;
}(React.Component);

var Buttons = function (_React$Component2) {
  _inherits(Buttons, _React$Component2);

  var _super2 = _createSuper(Buttons);

  function Buttons() {
    _classCallCheck(this, Buttons);

    return _super2.apply(this, arguments);
  }

  _createClass(Buttons, [{
    key: "render",
    value: function render() {
      return React.createElement("div", {
        id: "controls"
      }, React.createElement("div", {
        className: "tools"
      }, React.createElement("button", {
        type: "button",
        "class": "btn tool btn-outline-secondary"
      }, React.createElement("i", {
        className: "bi bi-brush"
      })), React.createElement("button", {
        type: "button",
        "class": "btn tool btn-outline-secondary"
      }, React.createElement("i", {
        className: "bi bi-eraser-fill"
      })), React.createElement("input", {
        type: "range",
        className: "tool",
        min: "1",
        max: "20",
        id: "lineWidth"
      }), React.createElement("button", {
        type: "button",
        className: "btn btn-danger tool",
        id: "clearButton",
        "data-toggle": "modal",
        "data-target": "#clearModal"
      }, "Clear")), React.createElement("div", {
        className: "modal fade",
        id: "clearModal",
        tabindex: "-1",
        role: "dialog",
        "aria-labelledby": "exampleModalLabel",
        "aria-hidden": "true"
      }, React.createElement("div", {
        className: "modal-dialog",
        role: "document"
      }, React.createElement("div", {
        className: "modal-content"
      }, React.createElement("div", {
        className: "modal-header"
      }, React.createElement("h5", {
        className: "modal-title",
        id: "exampleModalLabel"
      }, "Are you sure you want to clear the drawing?"), React.createElement("button", {
        type: "button",
        "class": "close",
        "data-dismiss": "modal",
        "aria-label": "Close"
      }, React.createElement("span", {
        "aria-hidden": "true"
      }, "\xD7"))), React.createElement("div", {
        className: "modal-body"
      }, "This action cannot be undone."), React.createElement("div", {
        className: "modal-footer"
      }, React.createElement("button", {
        type: "button",
        "class": "btn btn-secondary",
        "data-dismiss": "modal"
      }, "Close"), React.createElement("button", {
        type: "button",
        id: "clearDrawingConfirm",
        "class": "btn btn-danger",
        "data-dismiss": "modal"
      }, "Clear Drawing"))))));
    }
  }]);

  return Buttons;
}(React.Component);

var ColorWheel = function (_React$Component3) {
  _inherits(ColorWheel, _React$Component3);

  var _super3 = _createSuper(ColorWheel);

  function ColorWheel() {
    _classCallCheck(this, ColorWheel);

    return _super3.apply(this, arguments);
  }

  _createClass(ColorWheel, [{
    key: "render",
    value: function render() {
      return React.createElement("reinvented-color-wheel", {
        id: "colorWheel",
        hex: "#ff0000",
        "wheel-diameter": "200",
        "wheel-thickness": "20",
        "handle-diameter": "16",
        "wheel-reflects-saturation": "false"
      });
    }
  }]);

  return ColorWheel;
}(React.Component);

var renderCanvas = function renderCanvas(renderLocation) {
  ReactDOM.render(React.createElement(Canvas, null), document.getElementById(renderLocation));
};

var renderButtons = function renderButtons(renderLocation) {
  ReactDOM.render(React.createElement(Buttons, null), document.getElementById(renderLocation), function () {
    document.querySelector('#clearDrawingConfirm').addEventListener('click', drawController.clearServerDrawing);
  });
};

var renderColorWheel = function renderColorWheel(renderLocation) {
  ReactDOM.render(React.createElement(ColorWheel, null), document.getElementById(renderLocation));
};

var setupNavLinks = function setupNavLinks() {
  document.querySelector('#room1').addEventListener('click', drawController.joinRoom);
  document.querySelector('#room2').addEventListener('click', drawController.joinRoom);
};

reactModule.renderCanvas = renderCanvas;
reactModule.renderButtons = renderButtons;
reactModule.renderColorWheel = renderColorWheel;
reactModule.setupNavLinks = setupNavLinks;
"use strict";

var touchController = {
  setupTouchListeners: function setupTouchListeners(drawController) {
    drawController.canvas.addEventListener("touchstart", touchController.touchStart);
    drawController.canvas.addEventListener("touchmove", touchController.touchMove);
    drawController.canvas.addEventListener("touchend", touchController.touchEnd);
    drawController.canvas.addEventListener("touchcancel", touchController.touchEnd);
  },
  getTouch: function getTouch(e) {
    var touchLocation = {};
    var touches = e.touches[0];
    touchLocation.x = touches.pageX - touches.target.offsetLeft;
    touchLocation.y = touches.pageY - touches.target.offsetTop;
    return touchLocation;
  },
  touchStart: function touchStart(e) {
    if (drawController.lockInput) return;
    var touchLocation = touchController.getTouch(e);
    drawController.dragging = true;
    drawController.ctx.moveTo(touchLocation.x, touchLocation.y);
    drawController.strokeStart.x = touchLocation.x;
    drawController.strokeStart.y = touchLocation.y;
  },
  touchMove: function touchMove(e) {
    if (!drawController.dragging || drawController.lockInput) return;
    var touchLocation = touchController.getTouch(e);
    drawController.ctx.beginPath();
    drawController.ctx.moveTo(drawController.strokeStart.x, drawController.strokeStart.y);
    drawController.ctx.strokeStyle = drawController.strokeStyle;
    drawController.ctx.lineWidth = drawController.lineWidth;
    drawController.ctx.lineTo(touchLocation.x, touchLocation.y);
    drawController.ctx.stroke();
    sendPathToServer(touchLocation);
    drawController.strokeStart.x = touchLocation.x;
    drawController.strokeStart.y = touchLocation.y;
  },
  touchEnd: function touchEnd(e) {
    drawController.dragging = false;
  }
};
