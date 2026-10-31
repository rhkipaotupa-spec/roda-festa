import { jsPDF } from 'jspdf';

// Read the approved document's content; never execute its print script.
export function readProposalDocument(document) {
  const text = (node) => node?.textContent.trim() || '';
  return {
    title: text(document.querySelector('.cover h1')),
    client: text(document.querySelector('.cover h2')),
    chips: [...document.querySelectorAll('.chips span')].map(text),
    facts: [...document.querySelectorAll('.fact')].map((n) => [text(n.querySelector('span')), text(n.querySelector('strong'))]),
    groups: [...document.querySelectorAll('.menu-group')].map((n) => ({
      title: text(n.querySelector('h3')),
      rows: [...n.querySelectorAll('tbody tr')].map((row) => [...row.querySelectorAll('td')].map(text)),
    })),
    composition: [...document.querySelectorAll('.composition-line')].map((n) => [text(n.querySelector('span')), text(n.querySelector('strong'))]),
    money: [...document.querySelectorAll('.money-card')].map((n) => [text(n.querySelector('span')), text(n.querySelector('strong')), text(n.querySelector('small'))]),
    terms: [...document.querySelectorAll('.term-card')].map((n) => ({title: text(n.querySelector('h3')), paragraphs: [...n.querySelectorAll('p')].map(text)})),
    footer: text(document.querySelector('.footer span')),
  };
}

// Explicit A4 coordinates make the saved PDF independent of Safari's HTML print pagination.
export function createProposalPdf(model, logoData) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const brown = '#4c2c22', gold = '#dfc195', cream = '#fbf5e9';
  const left = 16, width = 178, bottom = 277;
  let y = 20;
  function font(size = 10, bold = false, serif = false) {
    pdf.setFont(serif ? 'times' : 'helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size); pdf.setTextColor(brown);
  }
  function lines(text, w, size = 10, bold = false) {
    font(size, bold); return pdf.splitTextToSize(String(text), w);
  }
  function background() { pdf.setFillColor(cream); pdf.rect(0, 0, 210, 297, 'F'); }
  function newPage() {
    pdf.addPage(); background(); y = 20;
    font(10, true); pdf.text('RODA FESTA', left, y);
    font(9); pdf.text('Gastronomia que encanta', 194, y, {align: 'right'});
    pdf.setDrawColor(gold); pdf.line(left, 24, 194, 24); y = 33;
  }
  function ensure(height) { if (y + height > bottom) newPage(); }
  function heading(text) { ensure(16); font(20, false, true); pdf.text(text, left, y); y += 10; }
  function row(a, b, total = false) {
    const label = lines(a, 126, 10, total), value = lines(b, 40, 10, true);
    const height = Math.max(label.length, value.length) * 4.5 + 7;
    ensure(height); font(10, total); pdf.text(label, left + 3, y + 5);
    font(10, true); pdf.text(value, 191, y + 5, {align: 'right'});
    pdf.setDrawColor('#dec9a7'); pdf.line(left, y + height - 2, 194, y + height - 2); y += height;
  }

  // One physical PDF page, with no HTML box to spill onto another sheet.
  pdf.setFillColor(brown); pdf.rect(0, 0, 210, 297, 'F');
  if (logoData) {
    const image = pdf.getImageProperties(logoData);
    const h = Math.min(65, 62 * image.height / image.width);
    pdf.addImage(logoData, 'PNG', 74, 65, 62, h);
    y = 65 + h + 12;
  } else y = 120;
  font(9, true); pdf.setTextColor(gold); pdf.text('GASTRONOMIA QUE ENCANTA', 105, y, {align: 'center'}); y += 18;
  font(10); pdf.setTextColor(gold); pdf.text('PROPOSTA COMERCIAL', 105, y, {align: 'center'}); y += 13;
  font(30, false, true); pdf.setTextColor(gold);
  const titleLines = pdf.splitTextToSize(model.title, 166);
  pdf.text(titleLines, 105, y, {align: 'center'}); y += titleLines.length * 12;
  font(18); pdf.setTextColor(cream);
  const clientLines = pdf.splitTextToSize(model.client, 166);
  pdf.text(clientLines, 105, y, {align: 'center'}); y += clientLines.length * 8 + 10;
  font(11); pdf.setTextColor(cream); pdf.text(model.chips.join('   |   '), 105, y, {align: 'center'});

  newPage(); heading('Resumo do evento');
  for (let i = 0; i < model.facts.length; i += 2) {
    const pair = model.facts.slice(i, i + 2);
    const values = pair.map((fact) => lines(fact[1], 77, 10, true));
    const h = Math.max(...values.map((v) => v.length)) * 4.5 + 14;
    ensure(h + 4);
    pair.forEach((fact, j) => {
      const x = left + j * 91;
      pdf.setDrawColor('#d9c0a0'); pdf.setFillColor('#fffaf1'); pdf.roundedRect(x, y, 87, h, 3, 3, 'FD');
      font(8); pdf.text(fact[0].toUpperCase(), x + 5, y + 6);
      font(10, true); pdf.text(values[j], x + 5, y + 12);
    }); y += h + 4;
  }
  y += 4; heading('Cardápio selecionado');
  for (const group of model.groups) {
    if (!group.rows.length) continue;
    const groupHeader = () => {
      pdf.setFillColor(brown); pdf.roundedRect(left, y, width, 11, 2, 2, 'F');
      font(14, false, true); pdf.setTextColor(cream); pdf.text(group.title, left + 5, y + 7.5); y += 12;
    };
    ensure(25); groupHeader();
    for (const [name, quantity] of group.rows) {
      const rowHeight = Math.max(lines(name, 126).length, lines(quantity, 40).length) * 4.5 + 7;
      if (y + rowHeight > bottom) { newPage(); groupHeader(); }
      row(name, quantity);
    } y += 5;
  }

  ensure(135); heading('Investimento');
  font(13, false, true); pdf.text('Composição da proposta', left, y); y += 5;
  model.composition.forEach(([a, b], i) => row(a, b, i === model.composition.length - 1));
  y += 5;
  const cardWidth = (width - 8) / 3;
  const cardText = model.money.map(([label, value, note]) => ({label: lines(label.toUpperCase(), cardWidth - 8, 8), value: lines(value, cardWidth - 8, 15, true), note: lines(note, cardWidth - 8, 9)}));
  const cardHeight = Math.max(...cardText.map((c) => c.label.length * 3.5 + c.value.length * 6 + c.note.length * 4 + 14));
  ensure(cardHeight + 5);
  cardText.forEach((c, i) => {
    const x = left + i * (cardWidth + 4); const dark = i === 0;
    pdf.setFillColor(dark ? brown : '#fffaf1'); pdf.setDrawColor('#b78a43'); pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');
    let cy = y + 6;
    font(8); pdf.setTextColor(dark ? cream : brown); pdf.text(c.label, x + 4, cy); cy += c.label.length * 3.5 + 4;
    font(15, true); pdf.setTextColor(dark ? cream : brown); pdf.text(c.value, x + 4, cy); cy += c.value.length * 6 + 3;
    font(9); pdf.setTextColor(dark ? cream : brown); pdf.text(c.note, x + 4, cy);
  }); y += cardHeight + 12;

  const termBlocks = model.terms.map((t, i) => {
    const w = i < 2 ? 87 : width;
    const wrapped = t.paragraphs.map((p) => lines(p, w - 12, 10));
    return {...t, w, wrapped, height: 17 + wrapped.reduce((h, p) => h + p.length * 4.5 + 3, 0)};
  });
  const topHeight = Math.max(...termBlocks.slice(0, 2).map((t) => t.height));
  const totalTerms = topHeight + termBlocks.slice(2).reduce((h, t) => h + t.height + 4, 0) + 20;
  if (totalTerms < bottom - 33) ensure(totalTerms);
  heading('Condições comerciais e operacionais');
  const drawTerm = (term, x, top, height) => {
    pdf.setFillColor('#fffaf1'); pdf.setDrawColor('#dec9a7'); pdf.roundedRect(x, top, term.w, height, 3, 3, 'FD');
    font(12, false, true); pdf.text(term.title, x + 6, top + 7);
    let cy = top + 15;
    for (const p of term.wrapped) { font(10); pdf.text(p, x + 6, cy); cy += p.length * 4.5 + 3; }
  };
  ensure(topHeight);
  termBlocks.slice(0, 2).forEach((t, i) => drawTerm(t, left + i * 91, y, topHeight));
  y += topHeight + 4;
  for (const term of termBlocks.slice(2)) { ensure(term.height); drawTerm(term, left, y, term.height); y += term.height + 4; }
  const count = pdf.getNumberOfPages();
  for (let page = 2; page <= count; page++) {
    pdf.setPage(page); font(8); pdf.text(model.footer, left, 288); pdf.text(`${page} / ${count}`, 194, 288, {align: 'right'});
  }
  pdf.setProperties({title: `Proposta Roda Festa - ${model.title}`, creator: 'Roda Festa'});
  return pdf;
}
