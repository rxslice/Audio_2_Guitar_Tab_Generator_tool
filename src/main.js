import { processAudio } from './audioProcessor.js';
    import { generateTablature } from './tablatureGenerator.js';
    import { initializeDatabase, saveTranscription } from './database.js';
    import { playTablature } from './midiPlayer.js';
    import { exportToPdf } from './pdfExporter.js';
    import { exportToMidi } from './midiExporter.js';
    import * as Vex from 'vexflow';

    const audioFile = document.getElementById('audioFile');
    const guitarType = document.getElementById('guitarType');
    const processButton = document.getElementById('processButton');
    const tablatureOutput = document.getElementById('tablatureOutput');
    const progressBar = document.getElementById('progressBar');
    const tablatureCanvas = document.getElementById('tablatureCanvas');
    const playButton = document.getElementById('playButton');
    const pauseButton = document.getElementById('pauseButton');
    const playbackSpeed = document.getElementById('playbackSpeed');
    const exportTxtButton = document.getElementById('exportTxtButton');
    const exportPdfButton = document.getElementById('exportPdfButton');
    const exportMidiButton = document.getElementById('exportMidiButton');

    let db;
    let currentTablature = '';
    let isPlaying = false;
    let audioContext;

    async function init() {
      await initializeDatabase();
    }

    init();

    async function process() {
      const file = audioFile.files[0];
      const numStrings = parseInt(guitarType.value, 10);

      if (!file) {
        alert('Please select an audio file.');
        return;
      }

      try {
        const audioContext = new AudioContext();
        const fileReader = new FileReader();

        fileReader.onload = async (event) => {
          try {
            const audioBuffer = await audioContext.decodeAudioData(event.target.result);
            const progressCallback = (progress) => {
              progressBar.style.width = `${progress}%`;
            };
            const notes = await processAudio(audioBuffer, audioContext, numStrings, progressCallback);
            const tablature = generateTablature(notes, numStrings);
            tablatureOutput.textContent = tablature;
            currentTablature = tablature;

            // Render tablature using VexFlow
            renderVexFlowTablature(tablature, numStrings);

            await saveTranscription(file.name, numStrings, tablature);
          } catch (error) {
            console.error('Error processing audio:', error);
            alert('Error processing audio.');
          }
        };
        fileReader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error initializing audio context:', error);
        alert('Error initializing audio context.');
      }
    }

    function renderVexFlowTablature(tablature, numStrings) {
      const renderer = new Vex.Flow.Renderer(tablatureCanvas, Vex.Flow.Renderer.Backends.SVG);
      const ctx = renderer.getContext();
      ctx.clearRect(0, 0, tablatureCanvas.width, tablatureCanvas.height);

      const stave = new Vex.Flow.Stave(10, 0, 500);
      stave.addClef('tab').setContext(ctx).draw();

      const tabNotes = [];
      const lines = tablature.trim().split('\n');
      const stringMap = {};
      for (let i = 0; i < numStrings; i++) {
        stringMap[i + 1] = lines[numStrings - 1 - i].split('|')[1].trim();
      }

      let staveNotes = [];
      let currentNote = '';
      let currentString = 0;
      let currentFret = '';
      let currentType = '';
      for (let i = 0; i < stringMap[1].length; i++) {
        for (let string = 1; string <= numStrings; string++) {
          const char = stringMap[string][i];
          if (char === '-') {
            if (currentNote !== '') {
              staveNotes.push(new Vex.Flow.TabNote({
                positions: [{ str: currentString, fret: currentFret }],
                duration: 'q'
              }));
              currentNote = '';
              currentString = 0;
              currentFret = '';
              currentType = '';
            }
          } else if (char !== ' ') {
            currentString = string;
            currentFret = char.replace(/[^0-9]/g, '');
            currentType = char.replace(/[0-9]/g, '');
            if (currentType === 's') {
              staveNotes.push(new Vex.Flow.TabNote({
                positions: [{ str: currentString, fret: currentFret }],
                duration: 'q'
              }).addModifier(new Vex.Flow.Annotation('s'), 0));
            } else if (currentType === 'h') {
              staveNotes.push(new Vex.Flow.TabNote({
                positions: [{ str: currentString, fret: currentFret }],
                duration: 'q'
              }).addModifier(new Vex.Flow.Annotation('h'), 0));
            } else if (currentType === 'p') {
              staveNotes.push(new Vex.Flow.TabNote({
                positions: [{ str: currentString, fret: currentFret }],
                duration: 'q'
              }).addModifier(new Vex.Flow.Annotation('p'), 0));
            } else {
              currentNote = char;
            }
          }
        }
      }
      if (currentNote !== '') {
        staveNotes.push(new Vex.Flow.TabNote({
          positions: [{ str: currentString, fret: currentFret }],
          duration: 'q'
        }));
      }

      const voice = new Vex.Flow.Voice({ num_beats: staveNotes.length, beat_value: 4 });
      voice.addTickables(staveNotes);

      const formatter = new Vex.Flow.Formatter().joinVoices([voice]).format([voice], 400);
      voice.draw(ctx, stave);
    }

    processButton.addEventListener('click', process);

    playButton.addEventListener('click', () => {
      if (!currentTablature) {
        alert('Please process an audio file first.');
        return;
      }
      if (!audioContext) {
        audioContext = new AudioContext();
      }
      const numStrings = parseInt(guitarType.value, 10);
      const speed = parseFloat(playbackSpeed.value);
      playTablature(currentTablature, audioContext, numStrings, speed);
      isPlaying = true;
    });

    pauseButton.addEventListener('click', () => {
      if (isPlaying && audioContext) {
        audioContext.suspend();
        isPlaying = false;
      } else if (audioContext) {
        audioContext.resume();
        isPlaying = true;
      }
    });

    exportTxtButton.addEventListener('click', () => {
      if (!currentTablature) {
        alert('Please process an audio file first.');
        return;
      }
      const blob = new Blob([currentTablature], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tablature.txt';
      a.click();
      URL.revokeObjectURL(url);
    });

    exportPdfButton.addEventListener('click', () => {
      if (!currentTablature) {
        alert('Please process an audio file first.');
        return;
      }
      const numStrings = parseInt(guitarType.value, 10);
      exportToPdf(currentTablature, numStrings);
    });

    exportMidiButton.addEventListener('click', () => {
      if (!currentTablature) {
        alert('Please process an audio file first.');
        return;
      }
      const numStrings = parseInt(guitarType.value, 10);
      exportToMidi(currentTablature, numStrings);
    });
