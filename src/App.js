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

function truncateSequence(sequence, steps) {
  return sequence.slice(0, steps);
}

function extendSequence(sequence, steps) {
  const currentSequenceLength = sequence.length;
  const firstSequence = truncateSequence(sequence, 16);
  const extendBy = steps / 16 - currentSequenceLength / 16;

  let newSequenceEnd = [...sequence];

  for (let i = 0; i < extendBy; i++) {
    newSequenceEnd = [...newSequenceEnd, ...firstSequence];
  }

  return newSequenceEnd;
}

function mapSequenceArrayData(data, mapFn) {
  return Object.fromEntries(
    Object.entries(data).map(([key, val]) => [key, mapFn(val)])
  );
}

function stepReducer(state, action) {
  switch (action.type) {
    case 'play':
      return { ...state, isPlaying: true };
    case 'pause':
      return { ...state, isPlaying: false, step: 1 };
    case 'nextStep':
      return {
        ...state,
        step: state.step === state.steps ? 1 : state.step + 1
      };
    case 'setBPM':
      return { ...state, bpm: action.bpm };
    case 'setStepLength':
      return { ...state, stepLength: action.stepLength };
    case 'setSteps': {
      // are we extending or truncating?
      const currentSteps = state.steps;
      let newSequenceArrayData;
      if (currentSteps > action.steps) {
        // truncate
        newSequenceArrayData = mapSequenceArrayData(
          state.sequenceArrayData,
          ({ sequence, ...rest }) => {
            return {
              ...rest,
              sequence: truncateSequence(sequence, action.steps)
            };
          }
        );
      } else {
        //extend
        newSequenceArrayData = mapSequenceArrayData(
          state.sequenceArrayData,
          ({ sequence, ...rest }) => {
            return {
              ...rest,
              sequence: extendSequence(sequence, action.steps)
            };
          }
        );
      }
      return {
        ...state,
        steps: action.steps,
        sequenceArrayData: newSequenceArrayData,
        step: 1,
        selectedSequence: 1
      };
    }
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
    case 'setSelectedSequence':
      return {
        ...state,
        selectedSequence: action.selectedSequence
      };
    default:
      throw new Error(`${action.type} unknown`);
  }
}

const initialSequence = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function App() {
  const [state, dispatch] = useReducer(stepReducer, {
    step: 1,
    stepLength: 4,
    steps: 16,
    bpm: 120,
    isPlaying: false,
    selectedSequence: 1,
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
              selectedSequence={state.selectedSequence}
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
        <div
          style={{
            display: 'flex'
          }}
        >
          <SequenceSelection
            selectedSequence={state.selectedSequence}
            sequenceData={state.sequenceArrayOrder.map(sequenceId => {
              return state.sequenceArrayData[sequenceId].sequence;
            })}
            steps={state.steps}
            dispatch={dispatch}
            step={state.step}
          />
        </div>

        <div style={{ display: 'flex', marginTop: '40px' }}>
          <BPMAdjustment bpm={state.bpm} dispatch={dispatch} />
          <StepLengthAdjustment
            dispatch={dispatch}
            stepLength={state.stepLength}
          />
          <StepAdjustment dispatch={dispatch} steps={state.steps} />
        </div>
      </header>
    </div>
  );
}

function SequenceArray({
  sequence,
  step,
  setSequence,
  grouping = 4,
  label,
  selectedSequence
}) {
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
        {sequence.map((val, idx) => {
          if (
            idx >= selectedSequence * 16 - 16 &&
            idx < selectedSequence * 16
          ) {
            return (
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
            );
          }

          return null;
        })}
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

function StepAdjustment({ steps, dispatch }) {
  return (
    <label style={{ fontSize: '12px', fontWeight: 'bold', marginLeft: '20px' }}>
      Steps
      <select
        value={steps}
        onChange={e =>
          dispatch({
            type: 'setSteps',
            steps: parseInt(e.target.value)
          })
        }
      >
        <option value="16">16</option>
        <option value="32">32</option>
        <option value="48">48</option>
        <option value="64">64</option>
      </select>
    </label>
  );
}

function SequenceSelection({
  selectedSequence,
  steps,
  step,
  dispatch,
  sequenceData
}) {
  const sequenceCount = steps / 16;

  if (sequenceCount === 1) {
    return null;
  }

  return Array.from(Array(sequenceCount)).map((_, idx) => {
    const sequences = sequenceData.map(sequenceRow =>
      sequenceRow.slice(idx * 16, idx * 16 + 16)
    );
    return (
      <SequenceThumbnail
        key={idx}
        active={idx + 1 === selectedSequence}
        step={Math.floor((step - 1) / 16) === idx ? step % 16 || 16 : -1}
        setAsActive={() =>
          dispatch({ type: 'setSelectedSequence', selectedSequence: idx + 1 })
        }
        sequences={sequences}
      />
    );
  });
}

function SequenceThumbnail({ active, sequences, step, setAsActive }) {
  return (
    <div
      style={{
        border: active ? '2px solid white' : 0,
        borderRadius: '3px',
        marginRight: '5px'
      }}
      onClick={setAsActive}
    >
      {sequences.map((sequence, idx) => {
        return (
          <SequenceThumbnailRow key={idx} sequence={sequence} step={step} />
        );
      })}
    </div>
  );
}

function SequenceThumbnailRow({ sequence, step }) {
  return (
    <div style={{ display: 'flex' }}>
      {sequence.map((on, idx) => (
        <div
          key={idx}
          style={{
            width: '8px',
            height: '3px',
            borderRadius: '1px',
            backgroundColor:
              idx + 1 === step ? 'white' : on ? 'magenta' : '#650065',
            margin: '0.5px'
          }}
        ></div>
      ))}
    </div>
  );
}

export default App;
