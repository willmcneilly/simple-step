import React, { useEffect, useState } from 'react';
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

function App() {
  const [step, setStep] = useState(1);
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

  const requestRef = React.useRef();
  const previousTimeRef = React.useRef();

  const loop = time => {
    if (previousTimeRef.current != undefined) {
      const delta = time - previousTimeRef.current;
      const beatLength = ((60 / 120) * 1000) / 4;

      if (delta >= beatLength) {
        setStep(prevStep => (prevStep === 16 ? 1 : prevStep + 1));
        previousTimeRef.current = time;
      }
    } else {
      previousTimeRef.current = time;
    }

    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

  useEffect(() => {
    if (kickSequence[step - 1] === 1) {
      kick.play();
    }
    if (snareSequence[step - 1] === 1) {
      snare.play();
    }
    // hat.play();
  }, [step]);

  return (
    <div className="App">
      <header className="App-header">
        <p>{step}</p>
        <div style={{ display: 'flex' }}>
          {kickSequence.map((state, idx) => (
            <button
              key={`kick-${idx}`}
              style={{
                backgroundColor: step - 1 === idx ? 'red' : '#eee',
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
              {state}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex' }}>
          {snareSequence.map((state, idx) => (
            <button
              key={`kick-${idx}`}
              style={{
                backgroundColor: step - 1 === idx ? 'red' : '#eee',
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
              {state}
            </button>
          ))}
        </div>
      </header>
    </div>
  );
}

export default App;
