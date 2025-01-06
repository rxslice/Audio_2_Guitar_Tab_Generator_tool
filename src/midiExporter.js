import { Midi } from '@tonejs/midi';

    export function exportToMidi(tablature, numStrings) {
      const midi = new Midi();
      const track = midi.addTrack();
      const lines = tablature.trim().split('\n');
      const stringMap = {};
      for (let i = 0; i < numStrings; i++) {
        stringMap[i + 1] = lines[numStrings - 1 - i].split('|')[1].trim();
      }

      let currentTime = 0;
      const noteDuration = 0.2;

      for (let i = 0; i < stringMap[1].length; i++) {
        for (let string = 1; string <= numStrings; string++) {
          const char = stringMap[string][i];
          if (char !== '-' && char !== ' ') {
            const fret = parseInt(char.replace(/[^0-9]/g, ''), 10);
            const midiNote = getMidiNote(string, fret, numStrings);
            track.addNote({
              midi: midiNote,
              time: currentTime,
              duration: noteDuration,
            });
            currentTime += noteDuration;
          }
        }
      }

      const midiData = midi.toArray();
      const blob = new Blob([midiData], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tablature.mid';
      a.click();
      URL.revokeObjectURL(url);
    }

    function getMidiNote(string, fret, numStrings) {
      const guitarStrings = {
        6: { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 },
        7: { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40, 7: 35 },
        8: { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40, 7: 35, 8: 30 },
      }[numStrings];
      return guitarStrings[string] + fret;
    }
