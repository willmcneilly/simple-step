import React, { useEffect, useState, useReducer, useLayoutEffect } from 'react';
import { Howl } from 'howler';
import { IoIosPlay, IoIosSquare } from 'react-icons/io';
import './App.css';

const kick = new Howl({
  src: ['kick.wav']
});
const hat = new Howl({
  src: ['hat.wav']
});
const snare = new Howl({ src: ['snare.wav'] });
const snareRim = new Howl({ src: ['snare-rim.wav'] });
const floorTom = new Howl({ src: ['floor-tom.wav'] });
const crash = new Howl({ src: ['crash.wav'] });

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
    case 'setBPM':
      return { ...state, bpm: action.bpm };
    case 'setStepLength':
      return { ...state, stepLength: action.stepLength };
    case 'updateSequenceAtIndex':
      return {
        ...state,
        sequenceArrayData: {
          ...state.sequenceArrayData,
          [action.sequenceId]: {
            ...state.sequenceArrayData[action.sequenceId],
            sequence: Object.assign(
              [],
              state.sequenceArrayData[action.sequenceId].sequence,
              {
                [action.updateAtIndex]: state.sequenceArrayData[
                  action.sequenceId
                ]['sequence'][action.updateAtIndex]
                  ? 0
                  : 1
              }
            )
          }
        }
      };
    default:
      throw new Error(`${action.type} unknown`);
  }
}

const initialSequence = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function App() {
  const [state, dispatch] = useReducer(stepReducer, {
    step: 1,
    bpm: 120,
    isPlaying: false,
    stepLength: 8,
    sequenceArrayOrder: [
      'kick',
      'snare',
      'snareRim',
      'hat',
      'crash',
      'floorTom'
    ],
    sequenceArrayData: {
      kick: {
        id: 'kick',
        label: 'Kick',
        sequence: initialSequence,
        sample: kick
      },
      snare: {
        id: 'snare',
        label: 'Snare',
        sequence: initialSequence,
        sample: snare
      },
      snareRim: {
        id: 'snareRim',
        label: 'Snare Rim',
        sequence: initialSequence,
        sample: snareRim
      },
      hat: { id: 'hat', label: 'Hat', sequence: initialSequence, sample: hat },
      crash: {
        id: 'crash',
        label: 'Crash',
        sequence: initialSequence,
        sample: crash
      },
      floorTom: {
        id: 'floorTom',
        label: 'Floor Tom',
        sequence: initialSequence,
        sample: floorTom
      }
    }
  });
  const beatLength = ((60 / state.bpm) * 1000) / state.stepLength;

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
    state.sequenceArrayOrder.forEach(sequenceId => {
      const data = state.sequenceArrayData[sequenceId];
      if (data.sequence[state.step - 1] === 1) {
        data.sample.play();
      }
    });
  }, [state.step, state.isPlaying]);

  return (
    <div className="App">
      <header className="App-header">
        <PlayButton isPlaying={state.isPlaying} dispatch={dispatch} />
        {state.sequenceArrayOrder.map(sequenceId => {
          const sequenceData = state.sequenceArrayData[sequenceId];
          return (
            <SequenceArray
              key={sequenceData.id}
              label={sequenceData.label}
              step={state.step}
              sequence={sequenceData.sequence}
              grouping={state.stepLength}
              setSequence={idx =>
                dispatch({
                  type: 'updateSequenceAtIndex',
                  sequenceId: sequenceData.id,
                  updateAtIndex: idx
                })
              }
            />
          );
        })}
        <div style={{ display: 'flex', marginTop: '40px' }}>
          <BPMAdjustment bpm={state.bpm} dispatch={dispatch} />
          <StepLengthAdjustment
            dispatch={dispatch}
            stepLength={state.stepLength}
          />
        </div>
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
        onMouseDown={_ => setMouseDown(true)}
        onMouseUp={_ => setMouseDown(false)}
        onMouseLeave={_ => setMouseDown(false)}
      >
        {sequence.map((val, idx) => (
          <button
            onMouseDown={_ => {
              setSequence(idx);
            }}
            onMouseEnter={_ => {
              if (mouseDown) {
                setSequence(idx);
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

function PlayButton({ isPlaying, dispatch }) {
  return (
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
        isPlaying ? dispatch({ type: 'pause' }) : dispatch({ type: 'play' });
      }}
    >
      {isPlaying ? <IoIosSquare /> : <IoIosPlay />}
    </button>
  );
}

function BPMAdjustment({ dispatch, bpm }) {
  return (
    <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
      BPM
      <input
        onChange={e => dispatch({ type: 'setBPM', bpm: e.target.value })}
        type="number"
        value={bpm}
        style={{
          marginLeft: '5px',
          width: '50px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      />
    </label>
  );
}

function StepLengthAdjustment({ stepLength, dispatch }) {
  return (
    <label style={{ fontSize: '12px', fontWeight: 'bold', marginLeft: '20px' }}>
      Step Length
      <select
        value={stepLength}
        onChange={e =>
          dispatch({
            type: 'setStepLength',
            stepLength: parseInt(e.target.value)
          })
        }
      >
        <option value="2">1/8 Note</option>
        <option value="3">1/8 Note Triplet</option>
        <option value="4">1/16 Note</option>
        <option value="6">1/16 Note Triplet</option>
        <option value="8">1/32 Note</option>
      </select>
    </label>
  );
}

export default App;
