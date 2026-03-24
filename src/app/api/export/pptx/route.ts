import { NextRequest, NextResponse } from 'next/server'
import PptxGenJS from 'pptxgenjs'

export const runtime = 'nodejs'

interface SlidePayload {
  title?: string
  content?: string[] | string
  bullet_points?: string[]
  key_points?: string[]
}

interface PresentationPayload {
  topic?: string
  slides?: SlidePayload[]
}

function getSlideContent(slide: SlidePayload) {
  const content = slide.content ?? slide.bullet_points ?? slide.key_points ?? ''

  if (Array.isArray(content)) {
    return content.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }

  if (typeof content === 'string' && content.trim().length > 0) {
    return content.trim()
  }

  return ''
}

export async function POST(req: NextRequest) {
  try {
    const { slides, topic }: PresentationPayload = await req.json()

    const pptx = new PptxGenJS()
    pptx.layout = 'LAYOUT_16x9'
    pptx.title = topic || 'RE:Agent Report'

    const titleSlide = pptx.addSlide()
    titleSlide.background = { color: '09090B' }
    titleSlide.addText(topic || 'RE:Agent Report', {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 1.5,
      fontSize: 36,
      color: 'FFFFFF',
      fontFace: 'Calibri',
      align: 'center',
      bold: true,
    })
    titleSlide.addText('RE:Agent | Back Office Operations', {
      x: 0.5,
      y: 3.5,
      w: 9,
      h: 0.5,
      fontSize: 14,
      color: '3B82F6',
      fontFace: 'Calibri',
      align: 'center',
    })
    titleSlide.addText(new Date().toLocaleDateString('cs-CZ'), {
      x: 0.5,
      y: 4.2,
      w: 9,
      h: 0.5,
      fontSize: 12,
      color: 'A1A1AA',
      fontFace: 'Calibri',
      align: 'center',
    })

    if (slides && Array.isArray(slides)) {
      for (const slide of slides) {
        const content = getSlideContent(slide)
        const deckSlide = pptx.addSlide()
        deckSlide.background = { color: 'FFFFFF' }

        deckSlide.addShape('rect' as never, {
          x: 0,
          y: 0,
          w: 10,
          h: 1,
          fill: { color: '09090B' },
          line: { color: '09090B' },
        })

        deckSlide.addText(slide.title || '', {
          x: 0.5,
          y: 0.15,
          w: 9,
          h: 0.7,
          fontSize: 24,
          color: 'FFFFFF',
          fontFace: 'Calibri',
          bold: true,
        })

        if (Array.isArray(content)) {
          const bulletText = content.map((point) => ({
            text: point,
            options: {
              fontSize: 16,
              color: '27272A',
              bullet: true,
              breakLine: true,
            },
          }))

          deckSlide.addText(bulletText, {
            x: 0.5,
            y: 1.3,
            w: 9,
            h: 4,
            fontFace: 'Calibri',
            paraSpaceAfter: 8,
          })
        } else if (typeof content === 'string') {
          deckSlide.addText(content, {
            x: 0.5,
            y: 1.3,
            w: 9,
            h: 4,
            fontSize: 16,
            color: '27272A',
            fontFace: 'Calibri',
          })
        }
      }
    }

    const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer
    const file = new Uint8Array(buffer)

    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="re-agent-report.pptx"',
      },
    })
  } catch (error) {
    console.error('PPTX generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown PPTX error' },
      { status: 500 }
    )
  }
}
