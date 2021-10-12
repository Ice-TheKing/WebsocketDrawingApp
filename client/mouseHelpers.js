const mouseController = {
  setupMouseListeners: (drawController) => {
    drawController.canvas.onmousedown = mouseController.mouseDown;
    drawController.canvas.onmousemove = mouseController.mouseMove;
    drawController.canvas.onmouseup = mouseController.mouseUp;
    drawController.canvas.onmouseout = mouseController.mouseOut;
  },
  
  getMouse: (e) => {
    let mouseLocation = {}
    mouseLocation.x = e.pageX - e.target.offsetLeft;
    mouseLocation.y = e.pageY - e.target.offsetTop;
    return mouseLocation;
  },
  
  mouseDown : (e) => {
    if (drawController.lockInput) return;
    
    let mouseLocation = mouseController.getMouse(e);
    
    drawController.dragging = true;
    
    // EYE DROPPER while holding alt
    if (e.altKey) {
      drawController.setToColorAtLocation(mouseLocation);
      return;
    }
    
    // drawController.ctx.beginPath();
    drawController.ctx.moveTo(mouseLocation.x, mouseLocation.y);
    // update the initial stroke location to give to the server
    drawController.strokeStart.x = mouseLocation.x;
    drawController.strokeStart.y = mouseLocation.y;
  },
  
  mouseMove : (e) => {
    if (!drawController.dragging || drawController.lockInput) return;
    
    let mouseLocation = mouseController.getMouse(e);
    
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
  
  mouseUp: (e) => {
    drawController.dragging = false;
  },
  
  mouseOut: (e) => {
    drawController.dragging = false;
  }
  
};