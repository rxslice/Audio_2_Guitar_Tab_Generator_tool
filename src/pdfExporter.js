import pdfMake from 'pdfmake/build/pdfmake';
    import pdfFonts from 'pdfmake/build/vfs_fonts';

    pdfMake.vfs = pdfFonts.pdfMake.vfs;

    export function exportToPdf(tablature, numStrings) {
      const docDefinition = {
        content: [
          { text: 'Guitar Tablature', style: 'header' },
          { text: tablature, style: 'tablature' },
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 20],
          },
          tablature: {
            font: 'Courier',
            fontSize: 12,
          },
        },
        defaultStyle: {
          font: 'Helvetica'
        }
      };
      pdfMake.createPdfKitDocument(docDefinition).download('tablature.pdf');
    }
