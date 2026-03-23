interface PresentationData {
  topic?: string
  slides: Array<{ title: string; content: string[] }>
}

export async function generatePPTX(data: PresentationData): Promise<Blob> {
  const res = await fetch('/api/export/pptx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('PPTX generation failed')
  return res.blob()
}
