import { forwardRef } from 'react';

/**
 * A4 portrait class list for a strand/section.
 * Shows all officially enrolled students (payment verified), sorted A-Z by last name.
 */
const PrintableClassList = forwardRef(function PrintableClassList(
  { strand, gradeLevel, semester, students },
  ref,
) {
  const today = new Date().toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const schoolYear =
    students[0]?.school_year ||
    `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  const sectionLabel = [strand, gradeLevel].filter(Boolean).join(' — ');

  return (
    <div
      ref={ref}
      style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#111',
        background: '#fff',
        width: '210mm',
        minHeight: '297mm',
        padding: '12mm 15mm',
        boxSizing: 'border-box',
        fontSize: '9pt',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '2.5px solid #15803d',
        paddingBottom: '8px',
        marginBottom: '10px',
      }}>
        <img
          src="/images/logo.png"
          alt="DBTC"
          style={{ width: '52px', height: '52px', objectFit: 'contain', flexShrink: 0 }}
        />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontSize: '13pt', fontWeight: 'bold',
            textTransform: 'uppercase', letterSpacing: '1px', lineHeight: 1.2,
          }}>
            Database Technology College
          </div>
          <div style={{
            fontSize: '10pt', fontWeight: '700',
            color: '#15803d', marginTop: '3px', letterSpacing: '0.5px',
          }}>
            CLASS LIST
          </div>
          <div style={{ fontSize: '7.5pt', color: '#666', marginTop: '3px' }}>
            S.Y. {schoolYear}
            {semester ? `  |  ${semester}` : ''}
          </div>
        </div>
      </div>

      {/* ── Section info strip ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '5px 16px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '4px',
        padding: '7px 12px',
        marginBottom: '12px',
      }}>
        <InfoCell label="Section / Strand" value={sectionLabel || '—'} />
        <InfoCell label="Grade Level"       value={gradeLevel || '—'} />
        <InfoCell label="Semester"          value={semester || '—'} />
      </div>

      {/* ── Student table ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
        <thead>
          <tr style={{ backgroundColor: '#15803d', color: '#fff' }}>
            <Th w="24px"  center>#</Th>
            <Th w="76px"        >Student No.</Th>
            <Th                 >Last Name</Th>
            <Th                 >First Name</Th>
            <Th                 >Middle Name</Th>
            <Th w="34px"  center>Sex</Th>
            <Th w="76px"        >LRN</Th>
            <Th w="80px"        >Type</Th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                style={{ textAlign: 'center', padding: '20px', color: '#999', fontStyle: 'italic' }}
              >
                No enrolled students found for this section
              </td>
            </tr>
          ) : (
            students.map((s, i) => (
              <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f0fdf4' }}>
                <Td center style={{ color: '#999' }}>{i + 1}</Td>
                <Td style={{ fontWeight: '600', color: '#15803d' }}>{s.student_number || '—'}</Td>
                <Td style={{ fontWeight: '500' }}>{s.last_name || '—'}</Td>
                <Td>{s.first_name || '—'}</Td>
                <Td>{s.middle_name || '—'}</Td>
                <Td center>{s.sex || '—'}</Td>
                <Td>{s.lrn || '—'}</Td>
                <Td>{s.enrollment_type ? s.enrollment_type.replace(/_/g, ' ') : '—'}</Td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ marginTop: '6px', fontSize: '8pt', textAlign: 'right', color: '#555' }}>
        Total Enrolled: <strong style={{ color: '#15803d' }}>{students.length}</strong>
      </div>

      {/* ── Signature lines ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '50px',
        marginTop: '40px',
      }}>
        <SigLine label="Prepared by" sub="Registrar" />
        <SigLine label="Noted by" sub="School Director / Principal" />
      </div>

      <div style={{ marginTop: '18px', fontSize: '7pt', color: '#aaa', textAlign: 'center' }}>
        Date Printed: {today}
      </div>
    </div>
  );
});

export default PrintableClassList;

/* ── Helpers ── */

function InfoCell({ label, value }) {
  return (
    <div>
      <div style={{
        fontSize: '6pt', color: '#16a34a', fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: '0.3px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '8pt', fontWeight: '500',
        borderBottom: '0.5px dotted #86efac', paddingBottom: '1px',
      }}>
        {value || '—'}
      </div>
    </div>
  );
}

function Th({ children, w, center }) {
  return (
    <th style={{
      border: '0.5px solid #15803d',
      padding: '4px 5px',
      textAlign: center ? 'center' : 'left',
      fontWeight: '600',
      width: w,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );
}

function Td({ children, center, style = {} }) {
  return (
    <td style={{
      border: '0.5px solid #d1d5db',
      padding: '3.5px 5px',
      textAlign: center ? 'center' : 'left',
      ...style,
    }}>
      {children}
    </td>
  );
}

function SigLine({ label, sub }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ borderBottom: '0.75px solid #333', height: '22px', marginBottom: '3px' }} />
      <div style={{
        fontSize: '7pt', fontWeight: '600',
        textTransform: 'uppercase', letterSpacing: '0.3px',
      }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: '6.5pt', color: '#666', marginTop: '1px' }}>{sub}</div>
      )}
    </div>
  );
}
