export function playTablature(tablature, audioContext, numStrings, playbackSpeed) {
      const lines = tablature.trim().split('\n');
      const stringMap = {};
      for (let i = 0; i < numStrings; i++) {
        stringMap[i + 1] = lines[numStrings - 1 - i].split('|')[1].trim();
      }

      const noteDuration = 0.2 * (1 / playbackSpeed);
      let currentTime = audioContext.currentTime;

      for (let i = 0; i < stringMap[1].length; i++) {
        for (let string = 1; string <= numStrings; string++) {
          const char = stringMap[string][i];
          if (char !== '-' && char !== ' ') {
            const fret = parseInt(char.replace(/[^0-9]/g, ''), 10);
            const noteType = char.replace(/[0-9]/g, '');
            const midiNote = getMidiNote(string, fret, numStrings);
            playNote(audioContext, midiNote, currentTime, noteDuration);
            if (noteType === 's') {
              playNote(audioContext, midiNote + 2, currentTime + noteDuration / 2, noteDuration / 2);
            }
            currentTime += noteDuration;
          }
        }
      }
    }

    function getMidiNote(string, fret, numStrings) {
      const guitarStrings = {
        6: { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 },
        7: { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40, 7: 35 },
        8: { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40, 7: 35, 8: 30 },
      }[numStrings];
      return guitarStrings[string] + fret;
    }

    function playNote(audioContext, midiNote, startTime, duration) {
      const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0.5, startTime);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    }
