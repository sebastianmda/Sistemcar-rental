// Generates the Sistemcar rental contract (+ Anexa 1) as a PDF, filled with the rental's data.
// The legal text and layout mirror "Contract_inchiriere_SISTEMCAR.docx" (versiunea din 29.09.2026, ora 10:24).
import { EQUIPMENT, FEES, fuelEighths, splitIdCard } from './rentalTerms'
import { fmtDate, fmtDateOnly, fmtTime, rentalDays } from './format'

export const DEFAULT_COMPANY = {
  nume: 'SISTEMCAR SRL',
  denumire_contract: 'S.C. SISTEMCAR S.R.L.',
  adresa: 'Comuna Nojorid, sat Leș nr. 16/A, jud. Bihor, 417348',
  sediu_contract: 'Comuna Nojorid, sat Leș nr. 16/A, jud. Bihor',
  telefon: '0746 089 174',
  email: 'sistemcarauto@gmail.com',
  reg_com: 'J2006002518053',
  cif: 'RO19249704',
  iban: 'RO35BTRLRONCRT0286900001',
  banca: 'Banca Transilvania',
  reprezentant: 'Ghile Ioan Marius',
  functie: 'administrator',
}

const NAVY = '#1B365D'
const TEXT = '#222222'
const GRAY = '#666666'
const LINE = '#C3C9D0'
const FILL = '#F4F6F8'

// keeps "16/A", "e-mail", "cheilor/documentelor" together so justified lines don't open a gap after "/" or "-"
const nb = (t) => String(t).replace(/(\S)([/-])(?=\S)/g, '$1$2\uFEFF')

const blank = (n) => '_'.repeat(n)
const has = (v) => v !== null && v !== undefined && String(v).trim() !== ''
// filled values are printed in bold; missing ones stay as a line to complete by hand
const val = (v, n = 14) => (has(v) ? { text: nb(String(v).trim()), bold: true } : blank(n))
const money = (n) => Number(n || 0).toLocaleString('ro-RO', { maximumFractionDigits: 2 })
const fix = (content) => (typeof content === 'string' ? nb(content) : content.map((c) => (typeof c === 'string' ? nb(c) : c)))

const P = (content, extra = {}) => ({ text: fix(content), style: 'p', ...extra })
const H = (text) => ({ text, style: 'h' })

function box(checked) {
  return {
    width: 10,
    canvas: [
      { type: 'rect', x: 0, y: 1.5, w: 7.5, h: 7.5, lineWidth: 0.7, lineColor: TEXT },
      ...(checked
        ? [
            { type: 'line', x1: 1.4, y1: 2.9, x2: 6.1, y2: 7.6, lineWidth: 1.1, lineColor: TEXT },
            { type: 'line', x1: 6.1, y1: 2.9, x2: 1.4, y2: 7.6, lineWidth: 1.1, lineColor: TEXT },
          ]
        : []),
    ],
  }
}

// one line made of text pieces and checkboxes: ['Curățenie 500 lei: ', box(false), ' nu ', box(true), ' da']
function line(parts, margin = [0, 0, 0, 4]) {
  return {
    columns: parts.map((part) =>
      typeof part === 'string' || Array.isArray(part) || (part && part.text !== undefined)
        ? { text: typeof part === 'string' ? nb(part) : part, width: 'auto' }
        : part
    ),
    columnGap: 3,
    margin,
  }
}

// "Label [ ] nu [ ] da" ; value: true / false / null (not filled in yet)
function yesNo(label, value, suffix) {
  const parts = [label, box(value === false), 'nu', { text: ' ', width: 4 }, box(value === true), 'da']
  if (suffix) parts.push(suffix)
  return line(parts)
}

// "Set foto …: [ ] da, nr. poze ____ [ ] nu"
function photoSet(label, count, known) {
  const yes = known ? count > 0 : null
  return line([
    label,
    box(yes === true),
    'da, nr. poze',
    yes ? { text: String(count), bold: true } : blank(4),
    { text: ' ', width: 6 },
    box(yes === false),
    'nu',
  ])
}

function signatureImage(image) {
  return image ? { image, fit: [140, 44], margin: [0, 2, 0, 2] } : { text: blank(24), margin: [0, 12, 0, 2] }
}

// "Label: [signature] / Nume: … / Data: …" (one column of a two-column signature block)
function signBlock(label, image, name, date) {
  const stack = [{ text: label }, signatureImage(image), { text: ['Nume: ', val(name, 28)], margin: [0, 2, 0, 0] }]
  if (date !== undefined) stack.push({ text: ['Data: ', val(date, 14)], margin: [0, 3, 0, 0] })
  return { stack }
}

function twoColumns(left, right, margin = [0, 8, 0, 6]) {
  return { columns: [{ width: '*', ...left }, { width: '*', ...right }], columnGap: 24, margin, unbreakable: true }
}

export function buildContractDefinition({ rental, company: companyIn, photoCounts = {} }) {
  const company = { ...DEFAULT_COMPANY, ...(companyIn || {}) }
  const client = rental.client || {}
  const vehicle = rental.vehicle || {}
  const id = splitIdCard(client.act_identitate)
  const returned = rental.status === 'finalizata'
  // number and date are typed in by the user; if missing they stay as lines to fill in by hand
  const contractDate = rental.data_contract ? fmtDate(rental.data_contract) : ''
  const signDate = contractDate || fmtDateOnly(rental.data_predare)
  const returnDate = returned ? fmtDateOnly(rental.data_returnare) : ''
  const nr = has(rental.numar_contract) ? String(rental.numar_contract).trim() : blank(6)
  const tarif = money(rental.tarif_zilnic)
  const agreedDays = rentalDays(rental.data_predare, rental.data_returnare_planificata)
  const equipment = rental.dotari_predare
  const fuelOut = fuelEighths(rental.combustibil_predare)
  const fuelIn = fuelEighths(rental.combustibil_primire)
  const photosKnown = photoCounts.predare !== undefined

  const equipmentRows = EQUIPMENT.map((e, i) => {
    const label = e.key === 'chei' ? `Cheie / chei (nr. ${has(rental.nr_chei) ? rental.nr_chei : blank(4)})` : e.label
    const v = equipment ? Boolean(equipment[e.key]) : null
    return [
      { text: String(i + 1) },
      { text: label },
      { stack: [box(v === true)], alignment: 'center' },
      { stack: [box(v === false)], alignment: 'center' },
    ]
  })

  const content = [
    // ---------- antet ----------
    { text: company.nume, fontSize: 14, bold: true, color: NAVY, alignment: 'center' },
    { text: nb(company.adresa), alignment: 'center', fontSize: 8 },
    { text: `Tel. ${company.telefon} · ${company.email}`, alignment: 'center', fontSize: 8 },
    { text: `${company.reg_com} · CIF ${company.cif}`, alignment: 'center', fontSize: 8 },
    { text: `IBAN ${company.iban} — ${company.banca}`, alignment: 'center', fontSize: 8 },
    { text: 'CONTRACT DE ÎNCHIRIERE AUTO', style: 'title', margin: [0, 12, 0, 2] },
    {
      text: ['Nr. ', { text: String(nr) }, ' / ', { text: contractDate || blank(14) }],
      alignment: 'center',
      bold: true,
      color: NAVY,
      margin: [0, 0, 0, 4],
    },

    // ---------- 1 ----------
    H('1. PĂRȚILE'),
    P(
      `Locator: ${company.denumire_contract}, sediul în ${company.sediu_contract}, ${company.reg_com}, CIF ${company.cif}, ` +
        `reprezentată de ${company.reprezentant} în calitate de ${company.functie}.`
    ),
    P(['Locatar: Nume ', val(client.nume, 32), ' domiciliu ', val(client.adresa, 32)]),
    P([
      'CI seria ', val(id.seria, 4), ' nr. ', val(id.nr, 10), ' CNP ', val(client.cnp, 18),
      ' tel. ', val(client.telefon, 14), ' e-mail ', val(client.email, 20),
    ]),
    P([
      'Permis categoria ', val(client.permis_categorie, 4), ' nr. ', val(client.permis_numar, 10),
      ' valabil până la ', val(client.permis_expira ? fmtDate(client.permis_expira) : '', 10),
    ]),
    P(['Șofer autorizat suplimentar (dacă e cazul): ', val(rental.sofer2_nume, 32), ' permis nr. ', val(rental.sofer2_permis, 10)]),

    // ---------- 2 ----------
    H('2. OBIECT'),
    P('Locatorul închiriază Locatarului autovehiculul:'),
    P([
      'Marcă/model ', val(vehicle.nume_model, 16), ' an ', val(vehicle.an_fabricatie, 4),
      ' nr. înmatriculare ', val(vehicle.inmatriculare, 10), ' VIN ', val(vehicle.vin, 20),
    ]),
    P(['Chiria: ', { text: `${tarif} lei/zi`, bold: true }, ' + TVA. Combustibilul nu este inclus. Autovehiculul se predă cu documentele și dotările din Anexa 1.']),

    // ---------- 3 ----------
    H('3. DURATA ȘI CALCULUL PERIOADEI DE ÎNCHIRIERE'),
    P([
      'Contractul începe la data și ora predării autovehiculului, consemnate în Anexa 1. Durata convenită este de ',
      { text: String(agreedDays), bold: true },
      ' zile.',
    ]),
    P(
      'La expirarea duratei convenite, dacă autovehiculul nu a fost restituit, închirierea se prelungește de drept, zi cu zi, la același tarif, ' +
        'până la restituirea efectivă sau până la împlinirea a 30 de zile de la predare. Pentru continuarea închirierii peste 30 de zile este ' +
        'necesar acordul scris al Locatorului, inclusiv prin SMS sau e-mail.'
    ),
    P(
      'La calculul perioadei de închiriere se includ atât ziua predării, cât și ziua restituirii autovehiculului, fiecare zi calendaristică în ' +
        'care autovehiculul se află la dispoziția Locatarului fiind considerată zi de închiriere și fiind facturată integral.'
    ),
    P(
      'Data și ora efectivă a predării și restituirii se consemnează în Anexa 1. Întârziere la retur de peste 1 oră se penalizează; ' +
        'peste 4 ore se facturează o zi întreagă.'
    ),

    // ---------- 4 ----------
    H('4. PREȚ'),
    P([
      'Chirie: ',
      { text: `${tarif} lei/zi`, bold: true },
      ' + TVA. Amenzile, taxele de drum, daunele, pierderea cheilor/documentelor și interiorul avariat sunt în sarcina Locatarului.',
    ]),
    P(
      'Autovehiculul se restituie curat și cu rezervorul la nivelul din Anexa 1. Taxe fixe, dacă este cazul: ' +
        `curățenie ${FEES.curatare} lei; igienizare pentru miros persistent (fumat, animale) ${FEES.igienizare} lei; ` +
        `alimentare efectuată de un angajat al Locatorului, dacă rezervorul nu este la nivelul predat, ${FEES.realimentare} lei / alimentare.`
    ),

    // ---------- 5 ----------
    H('5. FOLOSIRE ȘI DAUNE'),
    P(
      'Locatarul trebuie să aibă permis valabil, să conducă legal și să nu lase mașina altor persoane în afara șoferilor trecuți la art. 1. ' +
        'Ieșirea din România doar cu acord scris.'
    ),
    P(
      'Mașina are RCA și CASCO. Franșiza și daunele neacoperite (inclusiv interior) cad în sarcina Locatarului. La accident anunță Locatorul de ' +
        'îndată și întocmește amiabilă sau proces-verbal.'
    ),
    P(
      'Este interzisă spălarea mașinii, udarea roților sau a frânelor cât timp discurile și plăcuțele sunt încinse. Deteriorarea sistemului de ' +
        'frânare din această cauză este în sarcina Locatarului.'
    ),
    P(
      'Orice observație privind starea mașinii se face la predare, în Anexa 1 și în poze. Lipsa mențiunii înseamnă predare fără avarii vizibile ' +
        'suplimentare.'
    ),

    // ---------- 6 ----------
    H('6. RETUR'),
    P('Returul se face la sediul Locatorului, cu aceleași documente, chei și dotări. Se completează Anexa 1 punctul 2. Mașina se predă curată.'),

    // ---------- 7 ----------
    H('7. FINALE'),
    P(
      'Modificările se fac în scris (inclusiv e-mail/SMS confirmat). Litigiile se soluționează amiabil sau la instanțele din Bihor. ' +
        'Contractul se încheie în 2 exemplare. Anexa 1 face parte din contract.'
    ),
    P('Locatorul prelucrează datele Locatarului doar pentru executarea contractului și facturare.'),

    // ---------- semnături ----------
    {
      unbreakable: true,
      stack: [
        H('Semnături'),
        twoColumns(
          {
            stack: [
              { text: 'LOCATOR', bold: true },
              { text: company.nume, margin: [0, 2, 0, 0] },
              { text: ['Nume: ', { text: company.reprezentant, bold: true }] },
              { text: 'Semnătură / ștampilă:', margin: [0, 6, 0, 0] },
              signatureImage(rental.semnatura_locator_predare),
              { text: ['Data: ', val(signDate, 14)] },
            ],
          },
          {
            stack: [
              { text: 'LOCATAR', bold: true },
              { text: ['Nume: ', val(client.nume, 28)], margin: [0, 2, 0, 0] },
              { text: 'Semnătură:', margin: [0, 6, 0, 0] },
              signatureImage(rental.semnatura_locatar_predare),
              { text: ['Data: ', val(signDate, 14)] },
            ],
          },
          [0, 2, 0, 0]
        ),
      ],
    },

    // ---------- Anexa 1 ----------
    { text: 'ANEXA 1 — PROCES-VERBAL DE PREDARE-PRIMIRE', style: 'title', fontSize: 13, pageBreak: 'before' },
    {
      text: ['la Contractul nr. ', { text: String(nr), bold: true }, ' / ', { text: contractDate || blank(14), bold: true }],
      alignment: 'center',
      margin: [0, 0, 0, 6],
    },

    H('1. PREDARE către Locatar'),
    P([
      'Data ', val(fmtDateOnly(rental.data_predare), 10), ' ora ', val(fmtTime(rental.data_predare), 6),
      ' locul: ', val(rental.loc_predare || 'sediul Locatorului', 26),
    ]),
    P([
      'Vehicul: ', val(vehicle.nume_model, 10), ' nr. ', val(vehicle.inmatriculare, 10),
      ' km la bord: ', val(rental.km_predare, 10), ' combustibil: ', val(fuelOut, 6), ' / 8',
    ]),
    P(['Observații / avarii la predare: ', has(rental.observatii_predare) ? val(rental.observatii_predare) : blank(60)]),
    photoSet('Set foto predare:', photoCounts.predare || 0, photosKnown),
    { text: 'Dotări predate', bold: true, color: NAVY, margin: [0, 4, 0, 3] },
    {
      table: {
        headerRows: 1,
        widths: [26, '*', 60, 60],
        body: [
          [
            { text: 'Nr.', bold: true, fillColor: FILL },
            { text: 'Denumire', bold: true, fillColor: FILL },
            { text: 'Da', bold: true, fillColor: FILL, alignment: 'center' },
            { text: 'Nu', bold: true, fillColor: FILL, alignment: 'center' },
          ],
          ...equipmentRows,
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => LINE,
        vLineColor: () => LINE,
        paddingTop: () => 1.5,
        paddingBottom: () => 1.5,
      },
      fontSize: 8.5,
      margin: [0, 0, 0, 4],
    },
    twoColumns(
      signBlock('Locator (predare):', rental.semnatura_locator_predare, company.reprezentant),
      signBlock('Locatar (primire):', rental.semnatura_locatar_predare, client.nume)
    ),

    H('2. RETUR de la Locatar'),
    P(['Data ', val(returnDate, 10), ' ora ', val(returned ? fmtTime(rental.data_returnare) : '', 6)]),
    P([
      'Km la bord: ', val(returned ? rental.km_primire : '', 10),
      '   combustibil: ', val(returned ? fuelIn : '', 6), ' / 8',
      '   Zile facturabile: ', val(returned ? rental.zile_facturabile ?? rentalDays(rental.data_predare, rental.data_returnare) : '', 6),
    ]),
    P(['Observații / avarii la retur: ', returned && has(rental.observatii_primire) ? val(rental.observatii_primire) : blank(60)]),
    yesNo('Avarii noi:', returned ? Boolean(rental.avarii_noi) : null, returned && rental.avarii_noi ? '— detaliu: vezi observațiile' : `— detaliu: ${blank(36)}`),
    P(['Dotări lipsă: ', returned ? (has(rental.dotari_lipsa) ? val(rental.dotari_lipsa) : { text: 'nu', bold: true }) : blank(60)]),
    photoSet('Set foto retur:', photoCounts.primire || 0, returned && photosKnown),
    yesNo(`Curățenie ${FEES.curatare} lei:`, returned ? Boolean(rental.taxa_curatare) : null),
    yesNo(`Miros persistent / igienizare ${FEES.igienizare} lei:`, returned ? Boolean(rental.taxa_igienizare) : null),
    yesNo(`Alimentare de către Locator ${FEES.realimentare} lei:`, returned ? Boolean(rental.realimentare) : null),
    twoColumns(
      signBlock('Locator (retur):', rental.semnatura_locator_retur, company.reprezentant, returnDate),
      signBlock('Locatar (predare înapoi):', rental.semnatura_locatar_retur, client.nume, returnDate)
    ),
    {
      text: 'Anexa 1 face parte integrantă din contract. Predarea și returul se semnează pe loc, la datele de mai sus.',
      fontSize: 7.5,
      italics: true,
      color: GRAY,
      margin: [0, 4, 0, 0],
    },
  ]

  return {
    pageSize: 'A4',
    pageMargins: [50, 44, 50, 44],
    info: { title: `Contract ${nr} - ${client.nume || ''}`, author: company.nume },
    defaultStyle: { font: 'Roboto', fontSize: 9.5, lineHeight: 1.15, color: TEXT },
    styles: {
      title: { fontSize: 14, bold: true, alignment: 'center', color: NAVY },
      h: { fontSize: 10.5, bold: true, color: NAVY, margin: [0, 8, 0, 3] },
      p: { margin: [0, 0, 0, 4], alignment: 'justify' },
    },
    footer: (page) => ({
      text: [`${company.nume}  ·  pag. `, { text: String(page), bold: true }],
      alignment: 'center',
      fontSize: 7,
      color: GRAY,
      margin: [0, 14, 0, 0],
    }),
    content,
  }
}

let pdfMakePromise = null
function loadPdfMake() {
  // loaded only when a contract is generated, to keep the app fast
  pdfMakePromise ||= Promise.all([import('pdfmake/build/pdfmake'), import('pdfmake/build/vfs_fonts')]).then(([pm, fonts]) => {
    const pdfMake = pm.default || pm
    pdfMake.vfs = fonts.default || fonts
    return pdfMake
  })
  return pdfMakePromise
}

export async function contractPdfBlob(args) {
  const pdfMake = await loadPdfMake()
  const definition = buildContractDefinition(args)
  return new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(definition).getBlob((blob) => resolve(blob))
    } catch (err) {
      reject(err)
    }
  })
}

export function contractLabel(rental) {
  return rental.numar_contract ? `nr. ${rental.numar_contract}` : 'fără număr'
}

// next number to suggest (only as a hint — the user types the real one)
export function suggestContractNumber(rentals) {
  const max = rentals.reduce((m, r) => {
    const n = parseInt(String(r.numar_contract || '').replace(/\D+/g, ''), 10)
    return isFinite(n) ? Math.max(m, n) : m
  }, 0)
  return max ? String(max + 1) : ''
}

export function contractFileName(rental) {
  const name = (rental.client?.nume || 'client').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '_')
  const nr = String(rental.numar_contract || '').replace(/[^\w-]+/g, '-')
  return `Contract_${nr ? `${nr}_` : ''}${name}.pdf`
}

// Opens a PDF. `win` is a tab opened synchronously on the click (avoids popup blockers on iPhone).
export function showPdf(blob, fileName, win) {
  const url = URL.createObjectURL(blob)
  if (win && !win.closed) {
    win.location.href = url
  } else {
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

// Share sheet on iPhone (WhatsApp, Mail…); falls back to download on computers
export async function sharePdf(blob, fileName) {
  const file = new File([blob], fileName, { type: 'application/pdf' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }
  showPdf(blob, fileName)
  return 'downloaded'
}
