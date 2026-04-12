import * as XLSX from 'xlsx';
import { ATELIERS, ATELIER_NAMES } from '../data/mockData';

const REQUIRED_HEADERS = ['PRODUIT', 'LOTS'];
const KNOWN_HEADERS = ['PRODUIT', 'DCI', 'FORME', 'LOTS', ...ATELIERS];
const COLORS = ['#3CC2B1', '#5dd0c1', '#1B6862', '#FBB829', '#e0a020', '#2fa898', '#134e4a'];

const SAMPLE_ROWS = [
  ['Lotentin 100mg', 'Amlodipine', 'Comprimé pelliculé', 8, 6, 4, 8, '', '', '', 3, 3, 10, 2],
  ['Respirex Injectable', 'Salbutamol', 'Solution injectable', 10, '', '', '', 8, 12, '', 4, 4, 14, 2],
  ['Lyocef 1g', 'Céfazoline', 'Poudre lyophilisée', 12, '', '', '', '', '', 24, 4, 4, 16, 2],
];

export function downloadTemplate() {
  const wb = XLSX.utils.book_new();

  const headerRow = ['PRODUIT', 'DCI', 'FORME', 'LOTS', ...ATELIERS];
  const data = [headerRow, ...SAMPLE_ROWS];
  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 22 }, // PRODUIT
    { wch: 16 }, // DCI
    { wch: 22 }, // FORME
    { wch: 8 },  // LOTS
    ...ATELIERS.map(() => ({ wch: 6 })),
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'PDP');
  XLSX.writeFile(wb, 'Terion_PDP_Template.xlsx');
}

function validateHeaders(headers) {
  const warnings = [];
  const errors = [];

  for (const req of REQUIRED_HEADERS) {
    const altNames = req === 'PRODUIT' ? ['PRODUIT', 'PRODUCT'] : ['LOTS', 'LOT'];
    if (!altNames.some(n => headers.includes(n))) {
      errors.push(`Colonne requise manquante : "${req}"`);
    }
  }

  const hasAnyAtelier = ATELIERS.some(a => headers.includes(a));
  if (!hasAnyAtelier) {
    errors.push('Aucune colonne d\'atelier trouvée (A à J). Ajoutez au moins une colonne d\'atelier avec les temps de traitement.');
  }

  const unknown = headers.filter(h => h && !KNOWN_HEADERS.includes(h) && !['PRODUCT', 'LOT', 'FORM'].includes(h));
  if (unknown.length > 0) {
    warnings.push(`Colonnes non reconnues (ignorées) : ${unknown.join(', ')}`);
  }

  return { errors, warnings };
}

export async function parseExcelFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['xlsx', 'xls'].includes(ext)) {
    throw new Error('Format de fichier non supporté. Utilisez .xlsx ou .xls');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames.length) {
          reject(new Error('Le fichier Excel ne contient aucune feuille.'));
          return;
        }

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (!rows || rows.length === 0) {
          reject(new Error('Le fichier Excel est vide.'));
          return;
        }

        if (rows.length < 2) {
          reject(new Error('Le fichier ne contient qu\'un en-tête sans données. Ajoutez au moins une ligne de produit.'));
          return;
        }

        const headers = rows[0].map(h => String(h || '').trim().toUpperCase());
        const { errors, warnings } = validateHeaders(headers);

        if (errors.length > 0) {
          reject(new Error(errors.join('\n')));
          return;
        }

        const products = [];

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
            color: COLORS[(i - 1) % COLORS.length],
          });
        }

        if (products.length === 0) {
          reject(new Error('Aucun produit trouvé. Vérifiez que les lignes contiennent un nom de produit dans la colonne PRODUIT.'));
          return;
        }

        if (warnings.length > 0) {
          console.warn('[PDP Parser]', warnings.join('; '));
        }

        resolve(products);
      } catch (err) {
        reject(new Error('Erreur lors de la lecture du fichier : ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsArrayBuffer(file);
  });
}
