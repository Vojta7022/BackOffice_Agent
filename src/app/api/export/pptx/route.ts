import { NextRequest, NextResponse } from 'next/server'
import pptxgen from 'pptxgenjs'

interface SlideData {
  title: string
  content: string[]
}

interface PresentationPayload {
  topic?: string
  slides: SlideData[]
}

export async function POST(req: NextRequest) {
  const data: PresentationPayload = await req.json()

  const pptx = new pptxgen()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.title = data.topic ?? 'Prezentace'

  for (const slide of data.slides) {
    const s = pptx.addSlide()

    s.background = { color: '0f172a' }

    s.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 1.2,
      fill: { color: '064e3b' },
      line: { color: '064e3b' },
    })

    s.addText(slide.title, {
      x: 0.4, y: 0, w: '90%', h: 1.2,
      fontSize: 24,
      bold: true,
      color: 'ffffff',
      valign: 'middle',
    })

    s.addShape(pptx.ShapeType.rect, {
      x: 0, y: 1.2, w: '100%', h: 0.06,
      fill: { color: '10b981' },
      line: { color: '10b981' },
    })

    const bullets = slide.content.map(c => ({
      text: c,
      options: { bullet: { type: 'bullet' as const }, color: 'cbd5e1', fontSize: 16, paraSpaceAfter: 6 },
    }))

    if (bullets.length > 0) {
      s.addText(bullets, { x: 0.4, y: 1.5, w: '92%', h: 4.5, valign: 'top' })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await pptx.write({ outputType: 'arraybuffer' })

  return new NextResponse(Buffer.from(result as ArrayBuffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(data.topic ?? 'prezentace')}.pptx"`,
    },
  })
}
