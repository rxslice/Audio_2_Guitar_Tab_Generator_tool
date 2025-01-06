import Meyda from 'meyda';

    export async function processAudio(audioBuffer, audioContext, numStrings, progressCallback) {
      return new Promise(async (resolve, reject) => {
        try {
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;

          const analyzer = Meyda.createMeydaAnalyzer({
            audioContext: audioContext,
            source: source,
            bufferSize: 512,
            hopSize: 256,
            featureExtractors: ['amplitudeSpectrum', 'complexSpectrum', 'rms', 'spectralCentroid'],
          });

          source.connect(audioContext.destination);
          source.start();

          let notes = [];
          let time = 0;
          const hopTime = 256 / audioContext.sampleRate;
          const totalTime = audioBuffer.duration;
          let lastFrequency = 0;
          let lastAmplitude = 0;
          let lastNoteTime = 0;

          while (time < totalTime) {
            const features = analyzer.get();
            if (features && features.amplitudeSpectrum && features.rms && features.spectralCentroid) {
              const spectrum = features.amplitudeSpectrum;
              const rms = features.rms;
              const centroid = features.spectralCentroid;
              const maxIndex = spectrum.indexOf(Math.max(...spectrum));
              const frequency = maxIndex * audioContext.sampleRate / 512;
              const midiNote = Math.round(69 + 12 * Math.log2(frequency / 440));
              const amplitude = rms;

              if (midiNote > 0 && amplitude > 0.05) {
                const guitarStrings = {
                  6: { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 },
                  7: { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40, 7: 35 },
                  8: { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40, 7: 35, 8: 30 },
                }[numStrings];
                const [bestString, bestFret] = findBestFret(midiNote, guitarStrings, lastFrequency, lastNoteTime, time);
                if (bestString && bestFret !== null) {
                  let noteType = 'normal';
                  if (Math.abs(frequency - lastFrequency) > 50) {
                    noteType = 'slide';
                  }
                  if (amplitude > lastAmplitude * 1.5) {
                    noteType = 'hammer';
                  }
                  if (amplitude < lastAmplitude * 0.5) {
                    noteType = 'pull';
                  }
                  notes.push({ time: time, string: bestString, fret: bestFret, type: noteType, duration: time - lastNoteTime });
                  lastNoteTime = time;
                }
                lastFrequency = frequency;
                lastAmplitude = amplitude;
              }
            }
            time += hopTime;
            const progress = (time / totalTime) * 100;
            progressCallback(progress);
          }
          source.stop();
          analyzer.stop();
          resolve(notes);
        } catch (error) {
          reject(error);
        }
      });
    }

    function findBestFret(midiNote, guitarStrings, lastFrequency, lastNoteTime, time) {
      let bestString = null;
      let bestFret = null;
      let minFret = 25;
      let minDistance = 100;

      for (const [string, openNote] of Object.entries(guitarStrings)) {
        const stringNumber = parseInt(string, 10);
        if (openNote <= midiNote && midiNote <= openNote + 24) {
          const fret = midiNote - openNote;
          const distance = Math.abs(fret - (lastFret || 0)) + Math.abs(stringNumber - (lastString || 0));
          if (fret < minFret && distance < minDistance) {
            minFret = fret;
            bestString = stringNumber;
            bestFret = fret;
            minDistance = distance;
          }
        }
      }
      return [bestString, bestFret];
    }
