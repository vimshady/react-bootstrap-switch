import React from 'react';
import ReactDOM from 'react-dom';

export class Switch extends React.Component{

  constructor(props){
    super(props);

    this.state = {
      offset: null,
      skipAnimation: true,
      dragStart: false,
      focus: false,
      value: props.value,
      labelWidth: props.labelWidth,
      handleWidth: props.handleWidth
    };
  }

  componentDidMount(){
    this._recalculateWidth();
  }

  componentWillReceiveProps(nextProps){
    // ensure width is updated
    this.setState({
      labelWidth: nextProps.labelWidth,
      handleWidth: nextProps.handleWidth
    }, () => {
      this._recalculateWidth();
    });
  }

  value(val){
    if(val === undefined)
      return this.state.value;

    this._setValue(val === null ? null : !!val);
  }

  _wrapperClasses(){
    const {
      baseClass,
      bsSize,
      disabled,
      readonly,
      inverse,
      animate,
    } = this.props;

    const {
      value,
      skipAnimation,
      focus,
      dragStart,
    } = this.state;

    const classes = [ baseClass ];
    // classes = ["#{@_prop('baseClass')}"].concat @_prop('wrapperClass')
    classes.push(baseClass + (value ? "-on" : "-off"));

    if (bsSize)
      classes.push(baseClass + "-" + bsSize);

    if (disabled)
      classes.push(baseClass + "-disabled");

    if (readonly)
      classes.push(baseClass + "-readonly");

    if (value === null)
      classes.push(baseClass + "-indeterminate");

    if (inverse)
      classes.push(baseClass + "-inverse");

    // classes.push "#{@_prop('baseClass')}-id-#{@_prop('id')}" if @_prop('id')

    if (animate && !dragStart & !skipAnimation)
      classes.push(baseClass + "-animate");

    if (focus)
      classes.push(baseClass + "-focused");

    // console.log(classes);

    return classes.join(" ");
  }

  _recalculateWidth(){
    const onHandle = ReactDOM.findDOMNode(this.elmOnHandle);
    const offHandle = ReactDOM.findDOMNode(this.elmOffHandle);
    const label = ReactDOM.findDOMNode(this.elmLabel);

    // assuming that if the elms need to be resized, the size will be cleared elsewhere first
    const { handleWidth, labelWidth } = this.props;
    const newHandleWidth = handleWidth == "auto"
      ? Math.max(onHandle.offsetWidth, offHandle.offsetWidth)
      : handleWidth;

    const newLabelWidth = labelWidth == "auto"
      ? newHandleWidth
      : labelWidth;

    return this.setState({
      handleWidth: newHandleWidth,
      labelWidth: newLabelWidth
    }, () => {
      this._updateContainerPosition(null, true);
    });
  }

  _updateContainerPosition(state, noAnimate){
    const { handleWidth, offset, value } = (state ? state : this.state);
    const { inverse } = this.props;

    // skip animating if no offset yet
    const skipAnimation = noAnimate || (offset == null)

    let newOffset = offset;

    if (value === null) {
      newOffset = -(handleWidth / 2);
    } else if (value) {
      newOffset = inverse ? -handleWidth : 0;
    } else { 
      newOffset = inverse ? 0 : -handleWidth;
    }

    return this.setState({
      skipAnimation: skipAnimation,
      offset: newOffset
    });
  }

  _disableUserInput(){
    const { disabled, readonly } = this.props;

    return disabled || readonly;
  }

  _handleOnClick(e){
    if(this._disableUserInput())
      return;

    this._setValue(false)
    this._setFocus();
  }

  _handleOffClick(){
    if(this._disableUserInput())
      return;

    this._setValue(true)
    this._setFocus();
  }

  _handleKeyPress(e){
    console.log(e, "TRU"); // TODO - not working...
    if(!e.which || this._disableUserInput())
      return;

    switch(e.which){
      case 37:
        return this._setValue(false);

      case 39:
        return this._setValue(true);
    }
  }

  _handleLabelMouseDown(e){
    if(this.state.dragStart || this._disableUserInput())
      return;

    this.setState({
      dragStart: (e.pageX || e.touches[0].pageX) - this.state.offset
    });
    this._setFocus();
  }

  _handleLabelMouseMove(e){
    const { dragStart, handleWidth } = this.state;
    
    if(dragStart === undefined || dragStart === null || dragStart === false)
      return;

    const difference = (e.pageX || e.touches[0].pageX) - dragStart;
    if(difference < -handleWidth || difference > 0)
      return;

    this.setState({
      skipAnimation: false,
      offset: difference,
      dragged: true
    }); 
  }

  _handleLabelMouseUp(e){
    const { dragStart, value, dragged, offset, handleWidth } = this.state;
    
    if(dragStart === undefined || dragStart === null || dragStart === false)
      return;

    const { inverse } = this.props;

    let val = !value;

    if(dragged){
      val = offset > -(handleWidth / 2);
      val = inverse ? !val : val;
    }

    this.setState({
      dragStart: false,
      dragged: false,
      value: val
    }, () => {
      this._updateContainerPosition();
      this._fireStateChange();
    });
  }

  _setFocus(){
    this.setState({
      focus: true
    });
  }

  _setBlur(){
    this.setState({
      focus: false
    });
  }

  _setValue(val){
    if(val === this.state.value)
      return;

    this.setState({
      value: (val === undefined ? !this.state.value : val)
    }, () => {
      this._updateContainerPosition();
      this._fireStateChange();
    });
  }

  _fireStateChange(){
    const { onChange } = this.props;
    if (typeof onChange != "function")
      return;

    setTimeout(() => onChange(this, this.state.value), 0);
  }

  render() {
    const {
      baseClass,
      labelText,
      onColor, onText,
      offColor, offText,
      inverse, bsSize
    } = this.props;

    const {
      handleWidth, labelWidth, 
      offset,
      value
    } = this.state;
  
    const onHandle = <span ref={(e) => this.elmOnHandle = e} style={{ width: handleWidth }}
      className={`${baseClass}-handle-on ${baseClass}-${onColor}`} 
      onClick={this._handleOnClick.bind(this)} >
        { onText }
      </span>;
    const offHandle = <span ref={(e) => this.elmOffHandle = e} style={{ width: handleWidth }}
      className={`${baseClass}-handle-off ${baseClass}-${offColor}`}
      onClick={this._handleOffClick.bind(this)}>
        { offText }
      </span>;

    const label = <span className={`${baseClass}-label`} style={{width:labelWidth}} ref={(e) => this.elmLabel = e} 
      onTouchStart={this._handleLabelMouseDown.bind(this)} onTouchMove={this._handleLabelMouseMove.bind(this)} onTouchEnd={this._handleLabelMouseUp.bind(this)}
      onMouseDown={this._handleLabelMouseDown.bind(this)} onMouseMove={this._handleLabelMouseMove.bind(this)}
      onMouseUp={this._handleLabelMouseUp.bind(this)} onMouseLeave={this._handleLabelMouseUp.bind(this)}>
        { labelText }
      </span>

    let containerWidth = labelWidth + (handleWidth * 2);
    let wrapperWidth = labelWidth + handleWidth;
    if(containerWidth == wrapperWidth)
      containerWidth = wrapperWidth = "auto";

    const wrapperClass = this._wrapperClasses();

    return (
      <div className={ wrapperClass } style={{width:wrapperWidth}} >
        <div className={`${baseClass}-container`} ref="container" style={{width:containerWidth, marginLeft:offset}}>
          { inverse ? offHandle : onHandle}
          { label }
          { inverse ? onHandle : offHandle}
          <input type="checkbox" ref={e => this.element = e} />
        </div>
      </div>
    );
  }
}

// TODO - add defaultValue prop.
// then if the value prop is defined, always render to that regardless of other state changes?

Switch.defaultProps = {
  value: true,
  wrapperClass: "wrapper",
  handleWidth: "auto",
  labelWidth: "auto",
  onColor: "primary",
  offColor: "default",
  baseClass: "bootstrap-switch",
  onText: "ON",
  offText: "OFF",
  labelText: " ",
  inverse: false,
  bsSize: null,
  disabled: false,
  readonly: false,
  animate: true,
};

Switch.propTypes = {
  value: React.PropTypes.bool,
  inverse: React.PropTypes.bool,
  wrapperClass: React.PropTypes.string,
  handleWidth: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number
  ]),
  labelWidth: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number
  ]),
  onColor: React.PropTypes.string,
  offColor: React.PropTypes.string,
  baseClass: React.PropTypes.string,
  onText: React.PropTypes.string,
  offText: React.PropTypes.string,
  labelText: React.PropTypes.string,
  bsSize: React.PropTypes.string,
  disabled: React.PropTypes.bool,
  readonly: React.PropTypes.bool,
  animate: React.PropTypes.bool,
  onChange: React.PropTypes.func,
};
