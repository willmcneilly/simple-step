import React, { useEffect, useState, useReducer } from 'react';
import { Howler, Howl } from 'howler';
import './App.css';

const data = {
  timeSignature: '4/4',
  tempo: 120,
  length: 16,
  stepLength: '1/8 NOTE',
  sequence: [
    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1]
  ],
  instrumentSlots: { 0: 'KICK', 1: 'SNARE' }
};

const kick = new Howl({
  src: ['kick.wav']
});

const hat = new Howl({
  src: ['hat.wav']
});

const snare = new Howl({ src: ['snare.wav'] });

function useAnimationFrame(callback, interval, paused) {
  const requestRef = React.useRef();
  const previousTimeRef = React.useRef();

  const animate = time => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current;
      if (deltaTime >= interval) {
        if (!paused) {
          previousTimeRef.current = undefined;
          callback(deltaTime);
        }
        previousTimeRef.current = time;
      }
    } else {
      previousTimeRef.current = time;
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  React.useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [paused, interval]);
}

function stepReducer(state, action) {
  switch (action.type) {
    case 'play':
      return { ...state, isPlaying: true };
    case 'pause':
      return { ...state, isPlaying: false, step: 1 };
    case 'nextStep':
      return { ...state, step: state.step === 16 ? 1 : state.step + 1 };
    default:
      throw new Error(`${action.type} unknown`);
  }
}

function App() {
  const [state, dispatch] = useReducer(stepReducer, {
    step: 1,
    isPlaying: false
  });
  const [kickSequence, setKickSequence] = useState([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ]);
  const [snareSequence, setSnareSequence] = useState([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ]);
  const beatLength = ((60 / 120) * 1000) / 4;

  useAnimationFrame(
    _deltaTime => {
      dispatch({ type: 'nextStep' });
    },
    beatLength,
    !state.isPlaying
  );

  useEffect(() => {
    if (!state.isPlaying) {
      return;
    }
    if (kickSequence[state.step - 1] === 1) {
      kick.play();
    }
    if (snareSequence[state.step - 1] === 1) {
      snare.play();
    }
    // hat.play();
  }, [state.step, state.isPlaying]);

  return (
    <div className="App">
      <header className="App-header">
        <button
          onClick={() => {
            state.isPlaying
              ? dispatch({ type: 'pause' })
              : dispatch({ type: 'play' });
          }}
        >
          {state.isPlaying ? 'Stop' : 'Play'}
        </button>
        <p>{state.step}</p>
        <div style={{ display: 'flex' }}>
          {kickSequence.map((val, idx) => (
            <button
              key={`kick-${idx}`}
              style={{
                backgroundColor: state.step - 1 === idx ? 'red' : '#eee',
                width: 40,
                height: 40,
                border: 0,
                margin: 0.5,
                borderRadius: 3
              }}
              onClick={() => {
                setKickSequence(seq =>
                  Object.assign([], seq, { [idx]: seq[idx] ? 0 : 1 })
                );
              }}
            >
              {val}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex' }}>
          {snareSequence.map((val, idx) => (
            <button
              key={`kick-${idx}`}
              style={{
                backgroundColor: state.step - 1 === idx ? 'red' : '#eee',
                width: 40,
                height: 40,
                border: 0,
                margin: 0.5,
                borderRadius: 3
              }}
              onClick={() => {
                setSnareSequence(seq =>
                  Object.assign([], seq, { [idx]: seq[idx] ? 0 : 1 })
                );
              }}
            >
              {val}
            </button>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
