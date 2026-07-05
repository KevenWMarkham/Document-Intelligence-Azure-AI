import type { AnalyzeResult, DIField, DITable } from "./api";

function Confidence({ value }: { value?: number }) {
  if (value === undefined) return null;
  const pct = Math.round(value * 100);
  const tone = pct >= 90 ? "high" : pct >= 70 ? "mid" : "low";
  return (
    <span className={`confidence ${tone}`} title={`Confidence ${pct}%`}>
      <span className="confidence-bar" style={{ width: `${pct}%` }} />
      <span className="confidence-label">{pct}%</span>
    </span>
  );
}

function FieldValue({ field }: { field: DIField }) {
  if (field.type === "array") {
    const items = field.valueArray ?? [];
    return (
      <ul className="field-items">
        {items.map((item, i) => (
          <li key={i}>
            {item.type === "object" && item.valueObject ? (
              Object.entries(item.valueObject).map(([k, v]) => (
                <span key={k} className="kv">
                  <em>{k}</em> {v.content}
                </span>
              ))
            ) : (
              <span>{item.content}</span>
            )}
          </li>
        ))}
      </ul>
    );
  }
  return <span className="field-content">{field.content}</span>;
}

function TableView({ table }: { table: DITable }) {
  const grid: (typeof table.cells)[number][][] = Array.from({ length: table.rowCount }, () => []);
  for (const cell of table.cells) grid[cell.rowIndex]?.push(cell);
  return (
    <div className="table-scroll">
      <table>
        <tbody>
          {grid.map((row, r) => (
            <tr key={r}>
              {row.map((cell) =>
                cell.kind === "columnHeader" ? (
                  <th key={cell.columnIndex}>{cell.content}</th>
                ) : (
                  <td key={cell.columnIndex}>{cell.content}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ResultView({ result }: { result: AnalyzeResult }) {
  const pages = result.pages ?? [];
  const tables = result.tables ?? [];
  const documents = result.documents ?? [];
  const handwritten = (result.styles ?? []).some((s) => s.isHandwritten);

  return (
    <div className="results">
      <div className="badges">
        <span className="badge">model: {result.modelId}</span>
        <span className="badge">{pages.length} page{pages.length === 1 ? "" : "s"}</span>
        {(result.languages ?? []).slice(0, 3).map((l) => (
          <span key={l.locale} className="badge">
            {l.locale}
          </span>
        ))}
        {handwritten && <span className="badge">includes handwriting</span>}
      </div>

      {documents.map((doc, i) => (
        <section key={i}>
          <h3>
            Extracted fields{" "}
            <span className="muted">
              ({doc.docType}, confidence {Math.round(doc.confidence * 100)}%)
            </span>
          </h3>
          <table className="fields">
            <tbody>
              {Object.entries(doc.fields ?? {}).map(([name, field]) => (
                <tr key={name}>
                  <th>{name}</th>
                  <td>
                    <FieldValue field={field} />
                  </td>
                  <td className="conf-cell">
                    <Confidence value={field.confidence} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      {tables.length > 0 && (
        <section>
          <h3>Tables</h3>
          {tables.map((t, i) => (
            <TableView key={i} table={t} />
          ))}
        </section>
      )}

      <section>
        <details open={documents.length === 0 && tables.length === 0}>
          <summary>
            <h3>Document text</h3>
          </summary>
          <pre className="doc-text">{result.content}</pre>
        </details>
      </section>
    </div>
  );
}
