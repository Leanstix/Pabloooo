import { strToU8, zipSync } from 'fflate';
import { Cell, cellXml, column, escapeXml, XML } from './cells';
import { stylesXml } from './styles';
export interface Sheet { name: string; rows: Cell[][]; widths: number[]; headerRow?: number; merges?: string[]; }
function sheetXml(sheet: Sheet): string {
  if (sheet.rows.length > 1048576) throw new Error('Spreadsheet exceeds Excel row limit');
  const lastCol = column(sheet.widths.length - 1);
  const header = sheet.headerRow ?? 4;
  const links: string[] = [];
  const data = sheet.rows.map((row, i) => {
    row.forEach((cell, j) => { if (cell.link) links.push(`<hyperlink ref="${column(j)}${i + 1}" location="${escapeXml(cell.link)}" display="${escapeXml(cell.value)}"/>`); });
    return `<row r="${i + 1}" ht="${i === 0 ? 46 : i + 1 === header ? 32 : i < 3 ? 27 : 23}" customHeight="1">${row.map((cell, j) => cellXml(cell, j, i + 1)).join('')}</row>`;
  }).join('');
  return `${XML}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastCol}${Math.max(1, sheet.rows.length)}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="${header}" topLeftCell="A${header + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="23"/><cols>${sheet.widths.map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`).join('')}</cols><sheetData>${data}</sheetData>${sheet.headerRow && sheet.rows.length > header ? `<autoFilter ref="A${header}:${lastCol}${sheet.rows.length}"/>` : ''}${sheet.merges?.length ? `<mergeCells count="${sheet.merges.length}">${sheet.merges.map(ref => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>` : ''}${links.length ? `<hyperlinks>${links.join('')}</hyperlinks>` : ''}<printOptions horizontalCentered="1"/><pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`;
}
export function encodeWorkbook(sheets: Sheet[], generatedAt: string): Uint8Array {
  const entries: Record<string, Uint8Array> = {};
  const put = (name: string, xml: string) => { entries[name] = strToU8(xml); };
  put('[Content_Types].xml', `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`);
  put('_rels/.rels', `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`);
  put('xl/workbook.xml', `${XML}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${sheets.map((sheet, i) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`);
  put('xl/_rels/workbook.xml.rels', `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  put('xl/styles.xml', stylesXml);
  put('docProps/core.xml', `${XML}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Pabloooo Financial Report</dc:title><dc:creator>Pabloooo</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${escapeXml(generatedAt)}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${escapeXml(generatedAt)}</dcterms:modified></cp:coreProperties>`);
  put('docProps/app.xml', `${XML}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Pabloooo</Application></Properties>`);
  sheets.forEach((sheet, i) => put(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(sheet)));
  return zipSync(entries, { level: 6 });
}
