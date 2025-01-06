export function generateTablature(notes, numStrings) {
      const tabLines = {};
      for (let i = numStrings; i >= 1; i--) {
        tabLines[i] = [];
      }

      for (const note of notes) {
        for (let string = numStrings; string >= 1; string--) {
          if (string === note.string) {
            let noteSymbol = `-${note.fret}-`;
            if (note.type === 'slide') {
              noteSymbol = `s${note.fret}`;
            } else if (note.type === 'hammer') {
              noteSymbol = `h${note.fret}`;
            } else if (note.type === 'pull') {
              noteSymbol = `p${note.fret}`;
            }
            tabLines[string].push(noteSymbol);
          } else {
            tabLines[string].push('---');
          }
        }
      }

      let tablatureString = '';
      for (let string = numStrings; string >= 1; string--) {
        tablatureString += `${string}| ${tabLines[string].join('')}\n`;
      }
      return tablatureString;
    }
