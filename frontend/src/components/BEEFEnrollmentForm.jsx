import { forwardRef } from 'react';

/* ── Helpers ─────────────────────────────────────────────── */

function computeAge(birthday) {
  if (!birthday) return '';
  const today = new Date();
  const dob = new Date(birthday);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function parseBirthday(birthday) {
  if (!birthday) return { mm: '', dd: '', yyyy: '' };
  // expects YYYY-MM-DD
  const [yyyy, mm, dd] = birthday.split('-');
  return { mm: mm || '', dd: dd || '', yyyy: yyyy || '' };
}

/** Row of individual character cells (like the BEEF name boxes) */
function LetterBoxes({ value = '', count = 20 }) {
  const chars = value.toUpperCase().replace(/\s/g, ' ').split('');
  return (
    <div style={{ display: 'flex', gap: '1px', flexWrap: 'nowrap' }}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '15px',
            height: '17px',
            border: '0.8px solid #555',
            fontSize: '7.5pt',
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          {chars[i] ?? ''}
        </span>
      ))}
    </div>
  );
}

/** Row of individual digit cells (for LRN / dates) */
function DigitBoxes({ value = '', count = 12, width = '17px' }) {
  const chars = value.toString().split('');
  return (
    <div style={{ display: 'flex', gap: '1px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width,
            height: '17px',
            border: '0.8px solid #555',
            fontSize: '7.5pt',
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          {chars[i] ?? ''}
        </span>
      ))}
    </div>
  );
}

function Checkbox({ checked, label, style = {} }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', ...style }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '10px',
          height: '10px',
          border: '1px solid #333',
          fontSize: '8pt',
          fontWeight: 'bold',
          flexShrink: 0,
        }}
      >
        {checked ? '✓' : ''}
      </span>
      <span style={{ fontSize: '7.5pt' }}>{label}</span>
    </span>
  );
}

/** A horizontal ruled line for a form field */
function FieldLine({ label, value = '', style = {}, lineStyle = {} }) {
  return (
    <div style={{ flex: 1, ...style }}>
      <div
        style={{
          borderBottom: '0.8px solid #555',
          minHeight: '22px',
          fontSize: '8pt',
          paddingLeft: '2px',
          display: 'flex',
          alignItems: 'flex-end',
          paddingBottom: '2px',
          ...lineStyle,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '6pt', color: '#444', marginTop: '1px' }}>{label}</div>
    </div>
  );
}

/** Bordered section header */
function SectionHeader({ children }) {
  return (
    <div
      style={{
        backgroundColor: '#d9d9d9',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '8.5pt',
        padding: '3px 0',
        border: '0.8px solid #555',
        borderBottom: 'none',
        letterSpacing: '0.5px',
      }}
    >
      {children}
    </div>
  );
}

/* ── Page styles ─────────────────────────────────────────── */

const page = {
  fontFamily: 'Arial, Helvetica, sans-serif',
  color: '#000',
  background: '#fff',
  width: '210mm',
  minHeight: '297mm',
  padding: '8mm 12mm',
  boxSizing: 'border-box',
  fontSize: '8pt',
  position: 'relative',
};

const outerBorder = {
  border: '0.8px solid #555',
};

const rowStyle = {
  display: 'flex',
  gap: '0',
  borderBottom: '0.8px solid #555',
};

const cellStyle = {
  padding: '3px 5px',
  borderRight: '0.8px solid #555',
};

/* ═══════════════════════════════════════════════════════════
   BEEF ENROLLMENT FORM
═══════════════════════════════════════════════════════════ */

const BEEFEnrollmentForm = forwardRef(function BEEFEnrollmentForm({ profile }, ref) {
  const { mm, dd, yyyy } = parseBirthday(profile?.birthday);
  const age = computeAge(profile?.birthday);
  const hasLRN = !!(profile?.lrn);
  const isReturning =
    profile?.enrollment_type === 'RE_ENROLLEE' || !!profile?.is_returning_student;
  const isSHS =
    profile?.grade_level_to_enroll === 'Grade 11' ||
    profile?.grade_level_to_enroll === 'Grade 12';

  const lrn = profile?.lrn || '';
  const schoolYear = profile?.school_year || '';

  /* Split school year into two parts for boxes: e.g. "2023" and "2024" */
  const [syFrom = '', syTo = ''] = (schoolYear || '').split('-').map((s) => s.trim());

  return (
    <div ref={ref}>
      {/* ══════════════════ PAGE 1 ══════════════════ */}
      <div style={{ ...page, pageBreakAfter: 'always' }}>

        {/* Top-right stamp */}
        <div style={{ position: 'absolute', top: '8mm', right: '12mm', textAlign: 'right' }}>
          <div style={{ fontSize: '6pt', color: '#555' }}>Revised as of 03/27/2023</div>
          <div
            style={{
              border: '1px solid #333',
              padding: '1px 6px',
              fontSize: '7pt',
              fontWeight: 'bold',
              marginTop: '2px',
            }}
          >
            ANNEX 1
          </div>
        </div>

        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: '6px',
            paddingRight: '28mm',
          }}
        >
          <img
            src="/images/logo.png"
            alt="School Logo"
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11pt', fontWeight: 'bold', letterSpacing: '0.5px' }}>
              BASIC EDUCATION ENROLLMENT FORM
            </div>
            <div style={{ fontSize: '7.5pt', fontStyle: 'italic' }}>
              THIS FORM IS NOT FOR SALE.
            </div>
          </div>
        </div>

        {/* ── School Year + Grade Level + Checkboxes ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '4px' }}>
          {/* School Year */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '8pt', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              School Year
            </span>
            <DigitBoxes value={syFrom} count={4} width="14px" />
            <span style={{ fontSize: '10pt', fontWeight: 'bold' }}>-</span>
            <DigitBoxes value={syTo} count={4} width="14px" />
          </div>
          {/* Grade Level */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '8pt', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              Grade level to Enroll:
            </span>
            <DigitBoxes
              value={(profile?.grade_level_to_enroll || '').replace('Grade ', '')}
              count={2}
              width="18px"
            />
          </div>
          {/* LRN + Returning checkboxes */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '7.5pt', fontWeight: 'bold' }}>
              Check the appropriate box only
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '7.5pt' }}>1. With LRN?</span>
              <Checkbox checked={hasLRN} label="Yes" />
              <Checkbox checked={!hasLRN} label="No" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '7.5pt' }}>2. Returning (Balik-Aral)</span>
              <Checkbox checked={isReturning} label="Yes" />
              <Checkbox checked={!isReturning} label="No" />
            </div>
          </div>
        </div>

        {/* ── Instructions ── */}
        <div style={{ fontSize: '7pt', fontWeight: 'bold', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold' }}>INSTRUCTIONS: </span>
          <span style={{ fontWeight: 'normal', fontStyle: 'italic' }}>
            Print legibly all information required in CAPITAL letters. Submit accomplished form to
            the Person-in-Charge/Registrar/Class Adviser. Use black or blue pen only.
          </span>
        </div>

        {/* ══ LEARNER INFORMATION ══ */}
        <SectionHeader>LEARNER INFORMATION</SectionHeader>
        <div style={outerBorder}>

          {/* Row: PSA Birth Cert No. + LRN */}
          <div style={rowStyle}>
            <div style={{ ...cellStyle, flex: 1.4, borderRight: '0.8px solid #555' }}>
              <span style={{ fontSize: '7pt' }}>
                PSA Birth Certificate No. (if available upon registration)
              </span>
              <div style={{ borderBottom: '0.8px solid #555', minHeight: '16px', marginTop: '2px', fontSize: '8pt', paddingLeft: '2px' }}>
                {profile?.psa_birth_certificate_no || ''}
              </div>
            </div>
            <div style={{ ...cellStyle, flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '7pt' }}>Learner Reference No.</div>
              <DigitBoxes value={lrn} count={12} width="14px" />
            </div>
          </div>

          {/* Row: Name labels + Birthdate + Place of Birth */}
          <div style={{ ...rowStyle, alignItems: 'flex-start' }}>
            <div style={{ ...cellStyle, width: '42mm', borderRight: '0.8px solid #555' }}>
              <span style={{ fontSize: '7pt', fontWeight: 'bold' }}>(LRN) Last Name</span>
            </div>
            <div style={{ ...cellStyle, flex: 1, borderRight: '0.8px solid #555' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '7pt' }}>Birthdate (mm/dd/yyyy)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                  <DigitBoxes value={mm} count={2} width="14px" />
                  <span style={{ fontSize: '8pt', margin: '0 1px' }}>/</span>
                  <DigitBoxes value={dd} count={2} width="14px" />
                  <span style={{ fontSize: '8pt', margin: '0 1px' }}>/</span>
                  <DigitBoxes value={yyyy} count={4} width="14px" />
                </div>
              </div>
            </div>
            <div style={{ ...cellStyle, flex: 1, borderRight: 'none' }}>
              <span style={{ fontSize: '7pt' }}>Place of Birth (Municipality/City)</span>
              <div style={{ borderBottom: '0.8px solid #555', minHeight: '16px', marginTop: '2px', fontSize: '8pt', paddingLeft: '2px' }}>
                {profile?.city_municipality || ''}
              </div>
            </div>
          </div>

          {/* Row: Last Name boxes */}
          <div style={{ ...rowStyle }}>
            <div style={{ ...cellStyle, flex: 1 }}>
              <LetterBoxes value={profile?.last_name || ''} count={22} />
            </div>
          </div>

          {/* Row: First Name label + Sex + Age + Mother Tongue */}
          <div style={{ ...rowStyle, alignItems: 'flex-start' }}>
            <div style={{ ...cellStyle, width: '42mm', borderRight: '0.8px solid #555' }}>
              <span style={{ fontSize: '7pt', fontWeight: 'bold' }}>First Name</span>
            </div>
            <div style={{ ...cellStyle, borderRight: '0.8px solid #555', minWidth: '36px' }}>
              <div style={{ fontSize: '7pt' }}>Sex</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                <Checkbox checked={profile?.sex === 'Male'} label="Male" />
                <Checkbox checked={profile?.sex === 'Female'} label="Female" />
              </div>
            </div>
            <div style={{ ...cellStyle, borderRight: '0.8px solid #555', minWidth: '28px' }}>
              <div style={{ fontSize: '7pt' }}>Age</div>
              <div style={{ fontSize: '8pt', fontWeight: 'bold', marginTop: '2px' }}>{age}</div>
            </div>
            <div style={{ ...cellStyle, flex: 1, borderRight: 'none' }}>
              <div style={{ fontSize: '7pt' }}>Mother Tongue</div>
              <div style={{ borderBottom: '0.8px solid #555', minHeight: '16px', marginTop: '2px', fontSize: '8pt', paddingLeft: '2px' }}>
                {profile?.mother_tongue || ''}
              </div>
            </div>
          </div>

          {/* Row: First Name boxes */}
          <div style={rowStyle}>
            <div style={{ ...cellStyle, flex: 1 }}>
              <LetterBoxes value={profile?.first_name || ''} count={22} />
            </div>
          </div>

          {/* Row: Middle Name label + IP Community */}
          <div style={{ ...rowStyle, alignItems: 'flex-start' }}>
            <div style={{ ...cellStyle, width: '42mm', borderRight: '0.8px solid #555' }}>
              <span style={{ fontSize: '7pt', fontWeight: 'bold' }}>Middle Name</span>
            </div>
            <div style={{ ...cellStyle, flex: 1, borderRight: 'none', fontSize: '7pt' }}>
              Belonging to any Indigenous Peoples (IP) Community/Indigenous Cultural Community?{' '}
              <Checkbox checked={false} label="Yes" />
              <Checkbox checked={true} label="No" style={{ marginLeft: '4px' }} />
              <span style={{ marginLeft: '6px' }}>If Yes, please specify: ___________________</span>
            </div>
          </div>

          {/* Row: Middle Name boxes */}
          <div style={rowStyle}>
            <div style={{ ...cellStyle, flex: 1 }}>
              <LetterBoxes value={profile?.middle_name || ''} count={22} />
            </div>
          </div>

          {/* Row: Extension Name label + 4Ps */}
          <div style={{ ...rowStyle, alignItems: 'flex-start' }}>
            <div style={{ ...cellStyle, width: '42mm', borderRight: '0.8px solid #555' }}>
              <span style={{ fontSize: '7pt', fontWeight: 'bold' }}>
                Extension Name e.g. Jr., III (if applicable)
              </span>
            </div>
            <div style={{ ...cellStyle, flex: 1, borderRight: 'none', fontSize: '7pt' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>Is your family a beneficiary of 4Ps?</span>
                <Checkbox checked={false} label="Yes" />
                <Checkbox checked={true} label="No" />
                <span style={{ marginLeft: '8px' }}>If Yes, write the 4Ps Household ID Number below</span>
              </div>
              <div style={{ marginTop: '4px' }}>
                <DigitBoxes value="" count={14} width="14px" />
              </div>
            </div>
          </div>

          {/* Row: Extension Name boxes */}
          <div style={rowStyle}>
            <div style={{ ...cellStyle, flex: 1 }}>
              <LetterBoxes value={profile?.suffix || ''} count={8} />
            </div>
          </div>

          {/* Disability section */}
          <div style={{ ...cellStyle, borderBottom: 'none' }}>
            <div style={{ marginBottom: '3px', fontSize: '7.5pt' }}>
              <span style={{ fontWeight: 'bold' }}>Is the child a Learner with Disability?</span>
              {'  '}
              <Checkbox checked={false} label="Yes" />
              {'  '}
              <Checkbox checked={true} label="No" />
            </div>
            <div style={{ fontSize: '7pt', marginBottom: '2px' }}>
              If Yes, specify the type of disability:
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: '2px 8px',
                fontSize: '7pt',
              }}
            >
              <Checkbox checked={false} label="Visual Impairment" />
              <Checkbox checked={false} label="Hearing Impairment" />
              <Checkbox checked={false} label="Learning Disability" />
              <Checkbox checked={false} label="Intellectual Disability" />
              <Checkbox checked={false} label="a. blind" />
              <Checkbox checked={false} label="Autism Spectrum Disorder" />
              <Checkbox checked={false} label="Emotional-Behavioral Disorder" />
              <Checkbox checked={false} label="Orthopedic/Physical Handicap" />
              <Checkbox checked={false} label="b. low vision" />
              <Checkbox checked={false} label="Speech/Language Disorder" />
              <Checkbox checked={false} label="Cerebral Palsy" />
              <Checkbox checked={false} label="Special Health Problem/Chronic Disease" />
              <Checkbox checked={false} label="Multiple Disorder" />
              <span />
              <span />
              <Checkbox checked={false} label="a. Cancer" />
            </div>
          </div>
        </div>

        {/* ══ Current Address ══ */}
        <div style={{ marginTop: '4px' }}>
          <SectionHeader>{'Current Address'}</SectionHeader>

          <div style={{ ...outerBorder, borderTop: 'none' }}>
            <div style={{ ...rowStyle }}>
              <div style={{ ...cellStyle, flex: 1, borderRight: '0.8px solid #555' }}>
                <FieldLine label="House No." value={profile?.house_no_street?.split(' ')[0] || ''} />
              </div>
              <div style={{ ...cellStyle, flex: 2, borderRight: '0.8px solid #555' }}>
                <FieldLine label="Sitio/Street Name" value={profile?.house_no_street || ''} />
              </div>
              <div style={{ ...cellStyle, flex: 2, borderRight: 'none' }}>
                <FieldLine label="Barangay" value={profile?.barangay || ''} />
              </div>
            </div>
            <div style={{ ...rowStyle, borderBottom: 'none' }}>
              <div style={{ ...cellStyle, flex: 2, borderRight: '0.8px solid #555' }}>
                <FieldLine label="Municipality/City" value={profile?.city_municipality || ''} />
              </div>
              <div style={{ ...cellStyle, flex: 2, borderRight: '0.8px solid #555' }}>
                <FieldLine label="Province" value={profile?.province || ''} />
              </div>
              <div style={{ ...cellStyle, flex: 2, borderRight: '0.8px solid #555' }}>
                <FieldLine label="Country" value="Philippines" />
              </div>
              <div style={{ ...cellStyle, flex: 1, borderRight: 'none' }}>
                <FieldLine label="Zip Code" value="" />
              </div>
            </div>
          </div>
        </div>

        {/* ══ Permanent Address ══ */}
        <div style={{ marginTop: '4px' }}>
          <div style={{ ...outerBorder, padding: '3px 5px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: 'none' }}>
            <span style={{ fontSize: '7.5pt', fontWeight: 'bold' }}>Permanent Address</span>
            <span style={{ fontSize: '7pt', fontStyle: 'italic' }}>Same with your Current Address?</span>
            <Checkbox checked={true} label="Yes" />
            <Checkbox checked={false} label="No" />
          </div>
          <div style={{ ...outerBorder, borderTop: 'none' }}>
            <div style={rowStyle}>
              <div style={{ ...cellStyle, flex: 1, borderRight: '0.8px solid #555' }}>
                <FieldLine label="House No./Street" value={profile?.house_no_street?.split(' ')[0] || ''} />
              </div>
              <div style={{ ...cellStyle, flex: 2, borderRight: '0.8px solid #555' }}>
                <FieldLine label="Street Name" value={profile?.house_no_street || ''} />
              </div>
              <div style={{ ...cellStyle, flex: 2, borderRight: 'none' }}>
                <FieldLine label="Barangay" value={profile?.barangay || ''} />
              </div>
            </div>
            <div style={{ ...rowStyle, borderBottom: 'none' }}>
              <div style={{ ...cellStyle, flex: 2, borderRight: '0.8px solid #555' }}>
                <FieldLine label="Municipality/City" value={profile?.city_municipality || ''} />
              </div>
              <div style={{ ...cellStyle, flex: 2, borderRight: '0.8px solid #555' }}>
                <FieldLine label="Province" value={profile?.province || ''} />
              </div>
              <div style={{ ...cellStyle, flex: 2, borderRight: '0.8px solid #555' }}>
                <FieldLine label="Country" value="Philippines" />
              </div>
              <div style={{ ...cellStyle, flex: 1, borderRight: 'none' }}>
                <FieldLine label="Zip Code" value="" />
              </div>
            </div>
          </div>
        </div>

        {/* ══ Parent / Guardian ══ */}
        <div style={{ marginTop: '4px' }}>
          <SectionHeader>PARENT'S/GUARDIAN'S INFORMATION</SectionHeader>
          <div style={outerBorder}>
            {[
              { heading: "Father's Name", name: profile?.father_full_name, contact: profile?.father_contact },
              { heading: "Mother's Maiden Name", name: profile?.mother_full_name, contact: profile?.mother_contact },
              { heading: "Legal Guardian's Name", name: profile?.guardian_full_name, contact: profile?.guardian_contact },
            ].map(({ heading, name, contact }, idx, arr) => (
              <div key={heading} style={{ borderBottom: idx < arr.length - 1 ? '0.8px solid #555' : 'none' }}>
                <div style={{ fontSize: '7pt', fontWeight: 'bold', padding: '2px 5px' }}>{heading}</div>
                <div style={{ display: 'flex', borderTop: '0.8px solid #555' }}>
                  <div style={{ ...cellStyle, flex: 2, borderRight: '0.8px solid #555' }}>
                    <FieldLine label="Last Name" value={name?.split(' ')[0] || ''} />
                  </div>
                  <div style={{ ...cellStyle, flex: 2, borderRight: '0.8px solid #555' }}>
                    <FieldLine label="First Name" value={name?.split(' ').slice(1, -1).join(' ') || name || ''} />
                  </div>
                  <div style={{ ...cellStyle, flex: 2, borderRight: '0.8px solid #555' }}>
                    <FieldLine label="Middle Name" value="" />
                  </div>
                  <div style={{ ...cellStyle, flex: 2, borderRight: 'none' }}>
                    <FieldLine label="Contact Number" value={contact || ''} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ══════════════════ PAGE 2 ══════════════════ */}
      <div style={{ ...page }}>

        {/* ══ Returning Learner ══ */}
        <SectionHeader>For Returning Learner (Balik-Aral) and Those Who will Transfer/Move In</SectionHeader>
        <div style={{ ...outerBorder, borderTop: 'none' }}>
          <div style={rowStyle}>
            <div style={{ ...cellStyle, flex: 1.2, borderRight: '0.8px solid #555' }}>
              <FieldLine
                label="Last Grade Level Completed"
                value={profile?.last_grade_level_completed || ''}
              />
            </div>
            <div style={{ ...cellStyle, flex: 1, borderRight: 'none' }}>
              <FieldLine
                label="Last School Year Completed"
                value={profile?.last_school_year_completed || ''}
              />
            </div>
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <div style={{ ...cellStyle, flex: 2, borderRight: '0.8px solid #555' }}>
              <FieldLine
                label="Last School Attended"
                value={profile?.last_school_attended || ''}
              />
            </div>
            <div style={{ ...cellStyle, flex: 1, borderRight: 'none', display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
              <span style={{ fontSize: '7pt', whiteSpace: 'nowrap' }}>School ID</span>
              <DigitBoxes value="" count={6} width="14px" />
            </div>
          </div>
        </div>

        {/* ══ SHS Section ══ */}
        {isSHS && (
          <div style={{ marginTop: '4px' }}>
            <SectionHeader>For Learners in Senior High School</SectionHeader>
            <div style={{ ...outerBorder, borderTop: 'none' }}>
              <div style={rowStyle}>
                <div style={{ ...cellStyle, borderRight: '0.8px solid #555', minWidth: '60px' }}>
                  <div style={{ fontSize: '7pt', fontWeight: 'bold', marginBottom: '2px' }}>Semester</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Checkbox
                      checked={
                        profile?.semester === '1st Semester' || profile?.semester === '1st'
                      }
                      label="1st"
                    />
                    <Checkbox
                      checked={
                        profile?.semester === '2nd Semester' || profile?.semester === '2nd'
                      }
                      label="2nd"
                    />
                  </div>
                </div>
                <div style={{ ...cellStyle, flex: 1, borderRight: '0.8px solid #555' }}>
                  <FieldLine label="Track" value="" />
                </div>
                <div style={{ ...cellStyle, flex: 1, borderRight: 'none' }}>
                  <FieldLine label="Strand" value={profile?.strand || ''} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ Learning Modalities ══ */}
        <div
          style={{
            marginTop: '12px',
            border: '0.8px solid #555',
            padding: '6px 8px',
          }}
        >
          <div style={{ fontSize: '7.5pt', marginBottom: '4px' }}>
            If school will implement other distance learning modalities aside from face-to-face
            instruction, what would you prefer for your child?
          </div>
          <div style={{ fontSize: '7.5pt', fontWeight: 'bold', marginBottom: '4px' }}>
            Choose all that apply:
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: '4px 0',
              fontSize: '7.5pt',
            }}
          >
            <Checkbox checked={false} label="Modular (Print)" />
            <Checkbox checked={false} label="Online" />
            <Checkbox checked={false} label="Radio-Based Instruction" />
            <Checkbox checked={false} label="Blended" />
            <Checkbox checked={false} label="Modular (Digital)" />
            <Checkbox checked={false} label="Educational Television" />
            <Checkbox checked={false} label="Homeschooling" />
          </div>
        </div>

        {/* ══ Certification / Signature ══ */}
        <div style={{ marginTop: '24px', fontSize: '7.5pt', textAlign: 'center', lineHeight: 1.7 }}>
          I hereby certify that the above information given are true and correct to the best of my
          knowledge and I allow the Department of Education to use my child's details to create
          and/or update his/her learner profile in the Learner Information System. The information
          herein shall be treated as confidential in compliance with the Data Privacy Act of 2012.
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '40px',
            gap: '40px',
          }}
        >
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                borderBottom: '0.8px solid #333',
                height: '20px',
                marginBottom: '3px',
              }}
            />
            <div style={{ fontSize: '7pt', fontWeight: 'bold' }}>
              Signature Over Printed Name of Parent/Guardian
            </div>
          </div>
          <div style={{ flex: 0.6, textAlign: 'center' }}>
            <div
              style={{
                borderBottom: '0.8px solid #333',
                height: '20px',
                marginBottom: '3px',
              }}
            />
            <div style={{ fontSize: '7pt', fontWeight: 'bold' }}>Date</div>
          </div>
        </div>

      </div>
    </div>
  );
});

export default BEEFEnrollmentForm;
