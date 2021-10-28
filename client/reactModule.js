const reactModule = {};

class Canvas extends React.Component {
  render() {
    return (
      <div>
        <canvas id="mainCanvas" width={700} height={500} />
      </div>
    );
  }
}

class Buttons extends React.Component {
  render() {
    return (
      <div id="controls" >
        <div className="tools">
        <button type="button" class="btn tool btn-outline-secondary">
          <i className="bi bi-brush"></i>
        </button>
          
        <button type="button" class="btn tool btn-outline-secondary">
          <i className="bi bi-eraser-fill"></i>
        </button>
        
        <input type="range" className="tool" min="1" max="20" id="lineWidth" />
        
        <button type="button" className="btn btn-danger tool" id="clearButton" data-toggle="modal" data-target="#clearModal">Clear</button>
        </div>
        
        <div className="modal fade" id="clearModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalLabel">Are you sure you want to clear the drawing?</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                This action cannot be undone.
              </div>
              <div className="modal-footer">
                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                <button type="button" id="clearDrawingConfirm" class="btn btn-danger" data-dismiss="modal">Clear Drawing</button>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    );
  }
}

class ColorWheel extends React.Component {
  render() {
    return (
    <reinvented-color-wheel
          id="colorWheel"
          hex="#ff0000"
          wheel-diameter="200"
          wheel-thickness="20"
          handle-diameter="16"
          wheel-reflects-saturation="false"
          ></reinvented-color-wheel>
    );
  }
}


/*class renderCanvas extends React.Component {
  render() {
    return (
      <Canvas />
    );
  }
}*/

const renderCanvas = (renderLocation) => {
  ReactDOM.render(
    <Canvas />,
    document.getElementById(renderLocation),
  );
};

const renderButtons = (renderLocation) => {
  ReactDOM.render(
    <Buttons />,
    document.getElementById(renderLocation),
    () => {
      document.querySelector('#clearDrawingConfirm').addEventListener('click', drawController.clearServerDrawing);
  });
};

const renderColorWheel = (renderLocation) => {
  ReactDOM.render(
    <ColorWheel />,
    document.getElementById(renderLocation),
  );
};

reactModule.renderCanvas = renderCanvas;
reactModule.renderButtons = renderButtons;
reactModule.renderColorWheel = renderColorWheel;