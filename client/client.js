"use strict";

// Getting tablet pen pressure: 
// https://stackoverflow.com/questions/10507341/can-i-recognise-graphic-tablet-pen-pressure-in-javascript
// http://www.wacomeng.com/web/index.html

// Saving canvas to png:
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL

// undo/redo library:
// https://codepen.io/abidibo/pen/rmGBc

// canvas eye dropper tool:
// https://stackoverflow.com/questions/17221802/canvas-eyedropper

// Techniques for making brushes:
// http://perfectionkills.com/exploring-canvas-drawing-techniques/


let socket;

const DRAW_CONSTS = {
  DEFAULT_LINE_WIDTH: 3,
  DEFAULT_STROKE_STYLE: "#ff0000",
  DEFAULT_LINE_CAP: "round",
  DEFAULT_LINE_JOIN: "round",
  DEFAULT_BACK_COLOR: "lightgray"
};

let drawGlobals = {
  canvas: null,
  ctx: null,
  dragging: false,
  lineWidth: null,
  strokeStyle: null,
  strokeStart: {},
  previousMouseLocation: null,
  lockInput: false,
  
  changeLineWidth: (e) => {
    drawGlobals.lineWidth = e.target.value;
  },
  
  changeStrokeColor: (e) => {
    drawGlobals.strokeStyle = e.target.value;
  },
  
  clearServerDrawing: (e) => {
    socket.emit('clearDrawing');
  },
  
  clearLocalCanvas: (e) => {
    drawGlobals.ctx.clearRect(0, 0, drawGlobals.ctx.canvas.width, drawGlobals.ctx.canvas.height);
    fillBackground();
  },
};

let mouse = {
  getMouse: (e) => {
    let mouseLocation = {}
    mouseLocation.x = e.pageX - e.target.offsetLeft;
    mouseLocation.y = e.pageY - e.target.offsetTop;
    return mouseLocation;
  },
  mouseDown : (e) => {
    if (drawGlobals.lockInput) return;
    
    let mouseLocation = mouse.getMouse(e);
    
    // EYE DROPPER while holding alt
    if (e.altKey) {
      let pxData = drawGlobals.ctx.getImageData(mouseLocation.x, mouseLocation.y, 1, 1);
      drawGlobals.strokeStyle = `rgba(${pxData.data[0]}, ${pxData.data[1]}, ${pxData.data[2]}, ${pxData.data[3]})`;
      
      // TODO: This line is redundant. Right now it is only here because the #colorPicker.value can only read a #HHEEXX value, but the drawGlobals.strokeStyle
      // is a rgba() value. Setting the canvas ctx automatically converts it to a hex, so I'm just using that functionality instead of converting it myself
      drawGlobals.ctx.strokeStyle = drawGlobals.strokeStyle;
      
      document.querySelector('#colorPicker').value = drawGlobals.ctx.strokeStyle;
      return;
    }
    
    drawGlobals.dragging = true;
    // drawGlobals.ctx.beginPath();
    drawGlobals.ctx.moveTo(mouseLocation.x, mouseLocation.y);
    // update the initial stroke location to give to the server
    drawGlobals.strokeStart.x = mouseLocation.x;
    drawGlobals.strokeStart.y = mouseLocation.y;
  },
  mouseMove : (e) => {
    if (!drawGlobals.dragging || drawGlobals.lockInput) return;
    
    let mouseLocation = mouse.getMouse(e);
    drawGlobals.ctx.beginPath();
    drawGlobals.ctx.moveTo(drawGlobals.strokeStart.x, drawGlobals.strokeStart.y);
    drawGlobals.ctx.strokeStyle = drawGlobals.strokeStyle;
    drawGlobals.ctx.lineWidth = drawGlobals.lineWidth;
    drawGlobals.ctx.lineTo(mouseLocation.x, mouseLocation.y);
    drawGlobals.ctx.stroke();
    
    sendPathToServer(mouseLocation);
    
    drawGlobals.strokeStart.x = mouseLocation.x;
    drawGlobals.strokeStart.y = mouseLocation.y;
  },
  mouseUp: (e) => {
    drawGlobals.dragging = false;
  },
  mouseOut: (e) => {
    drawGlobals.dragging = false;
  }
};

const onKeyDown = (e) => {
  if (e.key === 'Alt') {
    e.preventDefault();
    document.body.style.cursor = "crosshair";
  }
};
const onKeyUp = (e) => {
  if (e.key === 'Alt') {
    e.preventDefault();
    document.body.style.cursor = "auto";
  }
};

const setupSocket = () => {      
  socket.on('pathToClient', drawPathFromServer);
  
  socket.on('initDrawing', (data) => {
    const drawingSteps = data.drawSteps;
    
    drawGlobals.lockInput = true;
    for(let i = 0; i < drawingSteps.length; i++) {
      drawPathFromServer(drawingSteps[i]);
    }
    drawGlobals.lockInput = false;
  });
  
  socket.on('clearDrawing', (data) => {
    drawGlobals.clearLocalCanvas();
  });
};

const sendPathToServer = (mouseLocation) => {
  let path = {
    start: drawGlobals.strokeStart,
    end: mouseLocation,
    style: drawGlobals.strokeStyle,
    width: drawGlobals.lineWidth
  };
  
  socket.emit('pathToServer', path);
};

const drawPathFromServer = (data) => {
  drawGlobals.ctx.save();
  
  drawGlobals.ctx.beginPath();
  drawGlobals.ctx.strokeStyle = data.style;
  drawGlobals.ctx.lineWidth = data.width;
  drawGlobals.ctx.moveTo(data.start.x, data.start.y);
  drawGlobals.ctx.lineTo(data.end.x, data.end.y);
  drawGlobals.ctx.stroke();
  
  drawGlobals.ctx.restore();
};
    
let fillBackground = () => {
  drawGlobals.ctx.save();
  
  drawGlobals.ctx.fillStyle = DRAW_CONSTS.DEFAULT_BACK_COLOR;
  drawGlobals.ctx.fillRect(0, 0, drawGlobals.ctx.canvas.width, drawGlobals.ctx.canvas.height);
  
  drawGlobals.ctx.restore();
};

const init = () => {
  /* INIT SOCKET */
  socket = io.connect();
  
  setupSocket();
  
  /* INIT CANVAS/DRAW APP */
  // Init Canvas
  drawGlobals.canvas = document.querySelector('#mainCanvas');
  drawGlobals.ctx = drawGlobals.canvas.getContext('2d');
  drawGlobals.lineWidth = DRAW_CONSTS.DEFAULT_LINE_WIDTH;
  drawGlobals.strokeStyle = DRAW_CONSTS.DEFAULT_STROKE_STYLE;
  
  drawGlobals.ctx.lineWidth = drawGlobals.lineWidth;
  drawGlobals.ctx.strokeStyle = drawGlobals.strokeStyle;
  drawGlobals.ctx.lineCap = DRAW_CONSTS.DEFAULT_LINE_CAP;
  drawGlobals.ctx.lineJoin = DRAW_CONSTS.DEFAULT_LINE_JOIN;
  
  drawGlobals.ctx.canvas.style.touchAction = "none";
  
  fillBackground();
  
  // Mouse event listeners
  drawGlobals.canvas.onmousedown = mouse.mouseDown;
  drawGlobals.canvas.onmousemove = mouse.mouseMove;
  drawGlobals.canvas.onmouseup = mouse.mouseUp;
  drawGlobals.canvas.onmouseout = mouse.mouseOut;
  // Keyboard listener
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  
  // Other listeners
  document.querySelector('#lineWidthSelector').onchange = drawGlobals.changeLineWidth;
  document.querySelector('#colorPicker').onchange = drawGlobals.changeStrokeColor;
  document.querySelector('#clearButton').addEventListener('click', drawGlobals.clearServerDrawing);
}

window.onload = init;