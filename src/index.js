// Slomux — упрощённая, сломанная реализация Flux.
// Перед вами небольшое приложение, написанное на React + Slomux.
// Это нерабочий секундомер с настройкой интервала обновления.

// Исправьте ошибки и потенциально проблемный код, почините приложение и прокомментируйте своё решение.

// При нажатии на "старт" должен запускаться секундомер и через заданный интервал времени увеличивать свое значение на значение интервала
// При нажатии на "стоп" секундомер должен останавливаться и сбрасывать свое значение

//should we be able to change currentTime while it's running?

import * as React from "react"
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'

const createStore = (reducer, initialState) => {
  let currentState = initialState
  const listeners = []

  const getState = () => currentState
  const dispatch = action => {
    currentState = reducer(currentState, action)
    listeners.forEach(listener => listener())
  }

  const subscribe = listener => listeners.push(listener)

  return { getState, dispatch, subscribe }
}

const connect = (mapStateToProps, mapDispatchToProps) =>
  Component => {
    class WrappedComponent extends React.Component {
      render() {
        return (
          <Component
            {...this.props}
            {...mapStateToProps(this.context.store.getState(), this.props)}
            {...mapDispatchToProps(this.context.store.dispatch, this.props)}
          />
        )
      }

      //mount/unmount subscription to be able to listen to state changes
      componentDidMount() {
        this.unsubscribe = this.context.store.subscribe(this.handleChange.bind(this))
      }

      componentWillUnmount() {
        this.unsubscribe()
      }

      handleChange = () => {
        this.forceUpdate()
      }
    }

    WrappedComponent.contextTypes = {
      store: PropTypes.object,
    }

    return WrappedComponent
  }

class Provider extends React.Component {
  getChildContext() {
    return {
      store: this.props.store,
    }
  }

  render() {
    return React.Children.only(this.props.children)
  }
}

Provider.childContextTypes = {
  store: PropTypes.object,
}

// APP

// actions
const CHANGE_INTERVAL = 'CHANGE_INTERVAL'

// action creators
const changeInterval = value => ({
  type: CHANGE_INTERVAL,
  payload: value,
})


// reducers
const reducer = (state, action) => {
  switch(action.type) {
    case CHANGE_INTERVAL:
      // actually assigning state as object, not as primitive.
      // + we don't need negative timer values
      return {...state, currentInterval: Math.max(0, state.currentInterval + action.payload)}
    default:
      return {}
  }
}

// components

class IntervalComponent extends React.Component {
  render() {
    return (
      <div>
        <span>Интервал обновления секундомера: {this.props.currentInterval} сек.</span>
        <span>
          <button onClick={() => this.props.changeInterval(-1)}>-</button>
          <button onClick={() => this.props.changeInterval(1)}>+</button>
        </span>
      </div>
    )
  }
}

const Interval = connect( //switched them around, they were in the wrong order
  state => ({
    currentInterval: state.currentInterval,
  }), dispatch => ({
    changeInterval: value => dispatch(changeInterval(value)),
  }))(IntervalComponent)

class TimerComponent extends React.Component {
  state = {
    currentTime: 0,
    timerId: null //added timerId to be able to clear it
  }

  //constructor to bing this in fns
  constructor(props) {
    super(props)

    this.handleStart = this.handleStart.bind(this)
    this.handleStop = this.handleStop.bind(this)
  }

  render() {
    return (
      <div>
        <Interval />
        <div>
          Секундомер: {this.state.currentTime} сек.
        </div>
        <div>
          <button onClick={this.handleStart}>Старт</button>
          <button onClick={this.handleStop}>Стоп</button>
        </div>
      </div>
    )
  }

  handleStart() {
    // don't need to start dispatching as many events as possible
    if (this.props.currentInterval === 0) {
      return;
    }
    const timerId = setInterval(() => this.setState({
      currentTime: this.state.currentTime + this.props.currentInterval,
    }), this.props.currentInterval * 1000) //setInterval takes in ms, not s
    this.setState({timerId: timerId}) // remembering to be able to clear it
  }

  handleStop() {
    //clear interval if was set
    if (this.state.timerId !== null) {
      clearInterval(this.state.timerId)
    }
    this.setState({ currentTime: 0, timerId: null })
  }
}

const Timer = connect(state => ({
  currentInterval: state.currentInterval, //again, state is not primitve, take out value from the object
}), () => {})(TimerComponent)

// init
// actually setting initialState here
ReactDOM.render(
  <Provider store={createStore(reducer, {currentInterval: 0})}>
    <Timer/>
  </Provider>,
  document.getElementById('app')
)

// tbh I prefer ;'s at the end of line