import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Bullet, ResumeSkeleton } from '@/lib/schema'

// Use react-pdf's bundled Helvetica — no external font fetch at render time,
// so PDF generation works fully offline and never fails on network hiccups.
const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 36,
    paddingHorizontal: 54,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111',
    lineHeight: 1.35,
  },

  // Header
  name: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  contact: {
    marginTop: 4,
    fontSize: 9.5,
    color: '#222',
    textAlign: 'center',
  },

  // Section rule + heading
  section: {
    marginTop: 16,
    paddingBottom: 2,
    borderBottomWidth: 0.75,
    borderBottomColor: '#111',
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Two-column "title left, dates right" row
  rowJustify: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 8,
  },
  titleLeft: { fontFamily: 'Helvetica-Bold', fontSize: 10.5 },
  titleRight: { fontSize: 9.5, color: '#222' },

  roleLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 1,
  },
  roleLeft: { fontFamily: 'Helvetica-Oblique', fontSize: 10 },

  // Bullets
  bulletRow: {
    flexDirection: 'row',
    marginTop: 3,
    paddingLeft: 4,
  },
  bulletDot: { width: 10 },
  bulletText: { flex: 1, fontSize: 10 },

  // Summary / education / skills text
  paragraph: { marginTop: 4, fontSize: 10 },
  skillsLine: { marginTop: 4, fontSize: 10 },
  skillsLabel: { fontFamily: 'Helvetica-Bold' },
})

export function ResumeTemplate({
  bullets,
  skeleton,
}: {
  bullets: Bullet[]
  skeleton: ResumeSkeleton
}) {
  const byExp = new Map<string, Bullet[]>()
  for (const b of bullets) {
    const arr = byExp.get(b.experience_id) ?? []
    arr.push(b)
    byExp.set(b.experience_id, arr)
  }

  const contactParts = [
    skeleton.contact.email,
    skeleton.contact.phone,
    skeleton.contact.location,
    ...skeleton.contact.links,
  ].filter(Boolean) as string[]

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <Text style={s.name}>{skeleton.name}</Text>
        {contactParts.length > 0 && (
          <Text style={s.contact}>{contactParts.join('  •  ')}</Text>
        )}

        {/* Summary (optional) */}
        {skeleton.summary && (
          <>
            <Text style={s.section}>Summary</Text>
            <Text style={s.paragraph}>{skeleton.summary}</Text>
          </>
        )}

        {/* Experience */}
        <Text style={s.section}>Experience</Text>
        {skeleton.experience.map((exp) => {
          const expBullets = byExp.get(exp.id) ?? []
          return (
            <View key={exp.id} wrap={false}>
              <View style={s.rowJustify}>
                <Text style={s.titleLeft}>{exp.company}</Text>
                <Text style={s.titleRight}>{exp.dates}</Text>
              </View>
              <View style={s.roleLine}>
                <Text style={s.roleLeft}>{exp.role}</Text>
              </View>
              {expBullets.map((b, i) => (
                <View key={i} style={s.bulletRow}>
                  <Text style={s.bulletDot}>•</Text>
                  <Text style={s.bulletText}>{b.tailored}</Text>
                </View>
              ))}
            </View>
          )
        })}

        {/* Skills */}
        {skeleton.skills.length > 0 && (
          <>
            <Text style={s.section}>Skills</Text>
            <Text style={s.skillsLine}>{skeleton.skills.join('  •  ')}</Text>
          </>
        )}

        {/* Education */}
        {skeleton.education.length > 0 && (
          <>
            <Text style={s.section}>Education</Text>
            {skeleton.education.map((e, i) => (
              <View key={i} style={s.rowJustify}>
                <Text style={s.titleLeft}>
                  {e.school}
                  {e.degree ? <Text style={s.roleLeft}> — {e.degree}</Text> : null}
                </Text>
                {e.dates ? <Text style={s.titleRight}>{e.dates}</Text> : null}
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  )
}
