import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { Bullet, ResumeSkeleton } from '@/lib/schema'

Font.register({
  family: 'Inter',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff',
    },
    {
      src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7SUc.woff',
      fontWeight: 700,
    },
  ],
})

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Inter', fontSize: 10, color: '#111' },
  name: { fontSize: 22, fontWeight: 700 },
  contact: { fontSize: 10, color: '#555', marginTop: 4 },
  section: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 18,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  expRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  expName: { fontSize: 11, fontWeight: 700 },
  expDates: { fontSize: 10, color: '#555' },
  bullet: { marginTop: 3, marginLeft: 10 },
  summary: { marginTop: 4, lineHeight: 1.4 },
  skillsLine: { marginTop: 4, lineHeight: 1.4 },
  eduRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
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
  ].filter(Boolean)

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <Text style={s.name}>{skeleton.name}</Text>
        <Text style={s.contact}>{contactParts.join('  ·  ')}</Text>

        {skeleton.summary && (
          <>
            <Text style={s.section}>Summary</Text>
            <Text style={s.summary}>{skeleton.summary}</Text>
          </>
        )}

        <Text style={s.section}>Experience</Text>
        {skeleton.experience.map((exp) => (
          <View key={exp.id}>
            <View style={s.expRow}>
              <Text style={s.expName}>
                {exp.company} — {exp.role}
              </Text>
              <Text style={s.expDates}>{exp.dates}</Text>
            </View>
            {(byExp.get(exp.id) ?? []).map((b, i) => (
              <Text key={i} style={s.bullet}>
                • {b.tailored}
              </Text>
            ))}
          </View>
        ))}

        {skeleton.skills.length > 0 && (
          <>
            <Text style={s.section}>Skills</Text>
            <Text style={s.skillsLine}>{skeleton.skills.join(' · ')}</Text>
          </>
        )}

        {skeleton.education.length > 0 && (
          <>
            <Text style={s.section}>Education</Text>
            {skeleton.education.map((e, i) => (
              <View key={i} style={s.eduRow}>
                <Text>
                  {e.school}
                  {e.degree ? ` — ${e.degree}` : ''}
                </Text>
                {e.dates && <Text style={s.expDates}>{e.dates}</Text>}
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  )
}
