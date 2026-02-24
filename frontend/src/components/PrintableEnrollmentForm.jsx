import { forwardRef } from 'react';

/**
 * Enrollment slip sized for a DL envelope (220mm × 110mm).
 * Two-column body: subjects (left) + assessment of fees (right).
 */
const PrintableEnrollmentForm = forwardRef(function PrintableEnrollmentForm({ profile, subjects }, ref) {
  const today = new Date().toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const fullName = [
    profile?.last_name,
    profile?.first_name,
    profile?.middle_name,
    profile?.suffix,
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#111',
        background: '#fff',
        width: '220mm',
        height: '110mm',
        padding: '5mm 7mm',
        boxSizing: 'border-box',
        fontSize: '7.5pt',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '2.5px solid #15803d',
        paddingBottom: '4px',
        marginBottom: '4px',
        flexShrink: 0,
      }}>
        <img
          src="/images/logo.png"
          alt="DBTC"
          style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }}
        />
        <div>
          <div style={{ fontSize: '9.5pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.2 }}>
            Database Technology College
          </div>
          <div style={{ fontSize: '7pt', color: '#555' }}>Student Registration System — Enrollment Slip</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: '6.5pt', color: '#777' }}>
          <div>Issued: {today}</div>
        </div>
      </div>

      {/* ── Info strip ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
        gap: '3px 12px',
        marginBottom: '4px',
        padding: '4px 8px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '3px',
        flexShrink: 0,
      }}>
        <InfoCell label="Student Name" value={fullName || '—'} />
        <InfoCell label="ID Number"    value={profile?.student_number || '—'} />
        <InfoCell label="Strand"       value={profile?.strand || '—'} />
        <InfoCell label="School Year"  value={profile?.school_year || '—'} />
        <InfoCell label="Semester"     value={profile?.semester || '—'} />
      </div>

      {/* ── Body: subjects (left) + fees (right) ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: '8px' }}>

        {/* Left — Subjects */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7pt', flex: 1, height: '100%' }}>
            <thead>
              <tr style={{ backgroundColor: '#15803d', color: '#fff' }}>
                <Th w="16px" center>#</Th>
                <Th w="58px">Code</Th>
                <Th>Subject Name</Th>
                <Th w="82px">Schedule</Th>
              </tr>
            </thead>
            <tbody style={{ height: '100%' }}>
              {subjects.map((s, i) => (
                <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f0fdf4', height: `${100 / subjects.length}%` }}>
                  <Td center style={{ color: '#999' }}>{i + 1}</Td>
                  <Td style={{ fontWeight: '700', color: '#15803d' }}>{s.subject_code}</Td>
                  <Td>{s.subject_name}</Td>
                  <Td>{s.schedule}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', background: '#d1fae5', flexShrink: 0 }} />

        {/* Right — Assessment of Fees */}
        <div style={{ width: '62mm', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            fontSize: '7pt',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
            color: '#15803d',
            borderBottom: '1px solid #bbf7d0',
            paddingBottom: '3px',
            marginBottom: '4px',
          }}>
            Assessment of Fees
          </div>

          {/* Fee rows — each row flex:1 so they fill the column height */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {[
              'Tuition Fee',
              'Misc. Fee',
              'Laboratory Fee',
              'Other Charges',
            ].map((fee) => (
              <div key={fee} style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '0.5px dotted #d1d5db',
                padding: '0 2px',
                fontSize: '7pt',
              }}>
                <span style={{ color: '#444' }}>{fee}</span>
                <span style={{ color: '#bbb', fontSize: '6.5pt' }}>PHP ___________</span>
              </div>
            ))}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1.5px solid #15803d',
              paddingTop: '3px',
              paddingBottom: '3px',
              fontSize: '7.5pt',
              fontWeight: 'bold',
            }}>
              <span>TOTAL</span>
              <span style={{ color: '#bbb', fontSize: '6.5pt' }}>PHP ___________</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Signatures ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginTop: '6px',
        flexShrink: 0,
      }}>
        <SigLine label="Student's Signature" sub={fullName} />
        <SigLine label="Registrar's Signature" />
      </div>
    </div>
  );
});

export default PrintableEnrollmentForm;

/* ── Helpers ── */

function InfoCell({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '6pt', color: '#16a34a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
        {label}
      </div>
      <div style={{ fontSize: '7.5pt', fontWeight: '500', borderBottom: '0.5px dotted #86efac', paddingBottom: '1px' }}>
        {value}
      </div>
    </div>
  );
}

function Th({ children, w, center }) {
  return (
    <th style={{
      border: '0.5px solid #15803d',
      padding: '3.5px 5px',
      textAlign: center ? 'center' : 'left',
      fontWeight: '600',
      width: w,
    }}>
      {children}
    </th>
  );
}

function Td({ children, center, style = {} }) {
  return (
    <td style={{
      border: '0.5px solid #d1d5db',
      padding: '3px 5px',
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
      <div style={{ borderBottom: '0.75px solid #333', height: '18px', marginBottom: '3px' }} />
      <div style={{ fontSize: '6.5pt', fontWeight: '600' }}>{label}</div>
      {sub && <div style={{ fontSize: '6pt', color: '#666', marginTop: '1px' }}>{sub}</div>}
    </div>
  );
}
