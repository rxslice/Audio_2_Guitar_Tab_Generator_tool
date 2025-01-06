import initSqlJs from '@sqlite.org/sqlite-wasm';

    let db;

    export async function initializeDatabase() {
      try {
        const sql = await initSqlJs({
          locateFile: file => `/node_modules/@sqlite.org/sqlite-wasm/${file}`
        });
        db = new sql.Database();
        db.run(`
          CREATE TABLE IF NOT EXISTS transcriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            audio_file_name TEXT,
            guitar_type INTEGER,
            tablature TEXT
          );
        `);
        console.log('Database initialized');
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    }

    export async function saveTranscription(fileName, numStrings, tablature) {
      if (db) {
        try {
          db.run(
            `INSERT INTO transcriptions (audio_file_name, guitar_type, tablature) VALUES (?, ?, ?)`,
            [fileName, numStrings, tablature]
          );
          console.log('Transcription saved to database');
        } catch (error) {
          console.error('Error saving transcription to database:', error);
        }
      }
    }
