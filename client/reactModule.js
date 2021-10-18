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
        </div>
        <input type="range" className="tool" min="0" max="20" id="lineWidth" />
        <button type="button" className="btn btn-danger tool" id="clearButton">Clear</button>
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
  );
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