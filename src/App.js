import React, { useEffect, useState, useReducer, useLayoutEffect } from 'react';
import { Howler, Howl } from 'howler';
import { IoIosPlay, IoIosSquare } from 'react-icons/io';
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

  useEffect(() => {
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

const initialSequence = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function App() {
  const [state, dispatch] = useReducer(stepReducer, {
    step: 1,
    isPlaying: false
  });
  const [kickSequence, setKickSequence] = useState(initialSequence);
  const [snareSequence, setSnareSequence] = useState(initialSequence);
  const [hatSequence, setHatSequence] = useState(initialSequence);
  const beatLength = ((60 / 120) * 1000) / 4;

  useAnimationFrame(
    _deltaTime => {
      dispatch({ type: 'nextStep' });
    },
    beatLength,
    !state.isPlaying
  );

  useLayoutEffect(() => {
    if (!state.isPlaying) {
      return;
    }
    if (kickSequence[state.step - 1] === 1) {
      kick.play();
    }
    if (snareSequence[state.step - 1] === 1) {
      snare.play();
    }
    if (hatSequence[state.step - 1] === 1) {
      hat.play();
    }
  }, [state.step, state.isPlaying]);

  return (
    <div className="App">
      <header className="App-header">
        <button
          style={{
            backgroundColor: 'transparent',
            color: '#eee',
            border: 0,
            padding: '20px 20px 10px 20px',
            fontSize: '60px',
            margin: 0,
            marginBottom: '40px'
          }}
          onClick={() => {
            state.isPlaying
              ? dispatch({ type: 'pause' })
              : dispatch({ type: 'play' });
          }}
        >
          {state.isPlaying ? <IoIosSquare /> : <IoIosPlay />}
        </button>
        <SequenceArray
          label="Kick"
          sequence={kickSequence}
          setSequence={setKickSequence}
          step={state.step}
        />
        <SequenceArray
          label="Snare"
          sequence={snareSequence}
          setSequence={setSnareSequence}
          step={state.step}
        />
        <SequenceArray
          label="Closed Hat"
          sequence={hatSequence}
          setSequence={setHatSequence}
          step={state.step}
        />
      </header>
    </div>
  );
}

function SequenceArray({ sequence, step, setSequence, grouping = 4, label }) {
  const [mouseDown, setMouseDown] = useState(false);
  return (
    <div style={{ display: 'flex' }}>
      <div
        style={{
          width: '140px',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'left',
          height: 40,
          lineHeight: '40px',
          textTransform: 'uppercase'
        }}
      >
        {label}
      </div>
      <div
        style={{ display: 'flex', marginBottom: '5px' }}
        onMouseDown={e => setMouseDown(true)}
        onMouseUp={_ => setMouseDown(false)}
        onMouseLeave={_ => setMouseDown(false)}
      >
        {sequence.map((val, idx) => (
          <button
            onMouseDown={_ => {
              setSequence(seq =>
                Object.assign([], seq, { [idx]: seq[idx] ? 0 : 1 })
              );
            }}
            onMouseEnter={_ => {
              if (mouseDown) {
                setSequence(seq =>
                  Object.assign([], seq, { [idx]: seq[idx] ? 0 : 1 })
                );
              }
            }}
            key={`kick-${idx}`}
            style={{
              backgroundColor: val ? 'magenta' : '#650065',
              width: 40,
              height: 40,
              border: step - 1 === idx ? '2px solid white' : 'none',
              borderRadius: 3,
              textIndent: '-9999px',
              marginRight: (idx + 1) % grouping === 0 ? '5px' : '1px'
            }}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
