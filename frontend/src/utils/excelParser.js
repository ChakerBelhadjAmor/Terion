import * as XLSX from 'xlsx';
import { ATELIERS, ATELIER_NAMES } from '../data/mockData';

/**
 * Parses a PDP Excel file and extracts product/lot data.
 * Expected sheet format:
 * | Produit | DCI | Forme | Lots | A | B | C | D | E | F | G | H | I | J |
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (!rows || rows.length < 2) {
          reject(new Error('Le fichier Excel est vide ou mal formaté.'));
          return;
        }

        const headers = rows[0].map(h => String(h || '').trim().toUpperCase());
        const products = [];
        const colors = ['#3CC2B1','#5dd0c1','#1B6862','#FBB829','#e0a020','#2fa898','#134e4a'];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0]) continue;

          const getCol = (name) => {
            const idx = headers.indexOf(name);
            return idx >= 0 ? row[idx] : undefined;
          };

          const name = String(getCol('PRODUIT') || getCol('PRODUCT') || row[0] || '').trim();
          if (!name) continue;

          const lots = parseInt(getCol('LOTS') || getCol('LOT') || 1) || 1;
          const gamme = [];
          const processingTimes = {};

          ATELIERS.forEach(atelier => {
            const timeStr = getCol(atelier);
            const time = parseFloat(timeStr);
            if (time > 0) {
              gamme.push(atelier);
              processingTimes[atelier] = time;
            }
          });

          if (gamme.length === 0) {
            // Assign a default gamme if none detected
            gamme.push('A', 'G', 'H', 'I', 'J');
            gamme.forEach(a => { processingTimes[a] = 4; });
          }

          products.push({
            id: i,
            name,
            dci: String(getCol('DCI') || '').trim(),
            form: String(getCol('FORME') || getCol('FORM') || '').trim(),
            lots,
            gamme,
            processingTimes,
            color: colors[(i - 1) % colors.length],
          });
        }

        if (products.length === 0) {
          reject(new Error('Aucun produit trouvé dans le fichier.'));
          return;
        }

        resolve(products);
      } catch (err) {
        reject(new Error('Erreur lors de la lecture du fichier: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsArrayBuffer(file);
  });
}
