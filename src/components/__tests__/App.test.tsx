import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import { MAX_FILE_SIZE_BYTES } from '@/components/FileUpload'
import type { AIClientInterface } from '@/context/AppContext'
import type { GeneratedProblemsResult, WorksheetAnalysis } from '@/ai/schemas'

const MOCK_ANALYSIS: WorksheetAnalysis = {
  identified_concepts: [
    {
      subject: 'Math',
      main_topic: 'Fractions',
      specific_concept: 'Simplifying fractions',
    },
  ],
  identified_question_formats: ['Simplify each fraction'],
  example_questions: ['a. 4/8 =', 'b. 6/15 ='],
  answer_bank_present: false,
  worksheet_directions: 'Simplify each fraction.',
  additional_notes_for_generation: '',
}

const MOCK_PROBLEMS: GeneratedProblemsResult = {
  problems: [
    { question: '1. Simplify 6/12 =', answer: '1/2' },
    { question: '2. Simplify 9/15 =', answer: '3/5' },
  ],
  answer_bank_present: false,
}

describe('School Worksheet Generator UI Flow (src/components/__tests__/App.test.tsx)', () => {
  let mockAIClient: AIClientInterface

  beforeEach(() => {
    const sampleBuffer = fs.readFileSync(path.resolve(process.cwd(), 'sample-worksheet.jpg'))
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(sampleBuffer, {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' },
      })
    )

    mockAIClient = {
      checkAvailability: vi.fn().mockResolvedValue('readily'),
      init: vi.fn().mockResolvedValue(undefined),
      analyzeWorksheet: vi.fn().mockResolvedValue(MOCK_ANALYSIS),
      generatePracticeProblems: vi.fn().mockResolvedValue(MOCK_PROBLEMS),
    }
  })

  it('loads sample-worksheet.jpg, analyzes the worksheet, generates practice problems, and reveals answers', async () => {
    const user = userEvent.setup()
    render(<App customAIClient={mockAIClient} />)

    // Verify Chrome Prompt API Ready badge renders
    await waitFor(() => {
      expect(screen.getByText('Chrome Prompt API Ready')).toBeInTheDocument()
    })

    // Analyze button is initially disabled before an image is selected
    const analyzeBtn = screen.getByRole('button', { name: /analyze worksheet/i })
    expect(analyzeBtn).toBeDisabled()

    // Click "Try Sample Worksheet (Fractions)"
    const sampleBtn = screen.getByRole('button', { name: /load sample fractions worksheet/i })
    await user.click(sampleBtn)

    // Wait for sample-worksheet.jpg preview to appear and Analyze button to become enabled
    await waitFor(() => {
      expect(screen.getByText('sample-worksheet.jpg')).toBeInTheDocument()
      expect(analyzeBtn).not.toBeDisabled()
    })

    // Click "Analyze Worksheet"
    await user.click(analyzeBtn)

    // Verify transition to Analysis & Generate view
    await waitFor(() => {
      expect(screen.getByText('Worksheet Analysis Results')).toBeInTheDocument()
    })
    expect(screen.getByText(/Math: Fractions - Simplifying fractions/i)).toBeInTheDocument()
    expect(screen.getAllByText(/a\. 4\/8 =/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/b\. 6\/15 =/i).length).toBeGreaterThanOrEqual(1)

    // Click "Generate Problems"
    const generateBtn = screen.getByRole('button', { name: /^generate problems$/i })
    await user.click(generateBtn)

    // Verify generated problems appear without answers initially revealed
    await waitFor(() => {
      expect(screen.getByText('1. Simplify 6/12 =')).toBeInTheDocument()
      expect(screen.getByText('2. Simplify 9/15 =')).toBeInTheDocument()
    })
    expect(screen.queryByText('1/2')).not.toBeInTheDocument()

    // Click "Reveal All Answers"
    const revealAllBtn = screen.getByRole('button', { name: /reveal all answers/i })
    await user.click(revealAllBtn)

    expect(screen.getByText('1/2')).toBeInTheDocument()
    expect(screen.getByText('3/5')).toBeInTheDocument()
  })

  it('supports customizing problem generation and displaying a shuffled Answer Bank', async () => {
    const user = userEvent.setup()
    mockAIClient.generatePracticeProblems = vi.fn().mockResolvedValue({
      problems: [
        { question: '1. Simplify 10/25 =', answer: '2/5' },
        { question: '2. Simplify 14/21 =', answer: '2/3' },
      ],
      answer_bank_present: true,
      answerBank: ['2/3', '2/5'],
    })

    render(<App customAIClient={mockAIClient} />)

    await user.click(screen.getByRole('button', { name: /load sample fractions worksheet/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /analyze worksheet/i })).not.toBeDisabled()
    })
    await user.click(screen.getByRole('button', { name: /analyze worksheet/i }))

    await waitFor(() => {
      expect(screen.getByText('Worksheet Analysis Results')).toBeInTheDocument()
    })

    const customInput = screen.getByLabelText(/your custom instructions/i)
    await user.type(customInput, 'Include harder denominators')
    await user.click(screen.getByRole('button', { name: /customize and regenerate/i }))

    await waitFor(() => {
      expect(screen.getByText('Answer Bank (Shuffled)')).toBeInTheDocument()
    })
    expect(mockAIClient.generatePracticeProblems).toHaveBeenCalledWith(
      expect.any(Object),
      5,
      'Include harder denominators'
    )
    expect(screen.getByText('1. Simplify 10/25 =')).toBeInTheDocument()
    expect(screen.getByText('2. Simplify 14/21 =')).toBeInTheDocument()
  })

  it('rejects unsupported file types dropped onto the upload zone', async () => {
    render(<App customAIClient={mockAIClient} />)

    const dropZone = screen.getByRole('button', { name: /image upload area/i })
    const invalidFile = new File(['<script>alert(1)</script>'], 'exploit.html', {
      type: 'text/html',
    })

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [invalidFile],
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Invalid File Type')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /analyze worksheet/i })).toBeDisabled()
  })

  it('rejects image files exceeding the 10MB size limit', async () => {
    render(<App customAIClient={mockAIClient} />)

    const dropZone = screen.getByRole('button', { name: /image upload area/i })
    const oversizedFile = new File(['img'], 'huge.png', { type: 'image/png' })
    Object.defineProperty(oversizedFile, 'size', { value: MAX_FILE_SIZE_BYTES + 1024 })

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [oversizedFile],
      },
    })

    await waitFor(() => {
      expect(screen.getByText('File Too Large')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /analyze worksheet/i })).toBeDisabled()
  })
})
