export function evaluateAttempt({ questions, answers, negativeMarkingEnabled, passingPercentage }) {
  const answersByQuestionId = new Map(answers.map((answer) => [answer.question_id, answer]))
  let score = 0
  let totalMarks = 0

  const perQuestion = questions.map((question) => {
    totalMarks += Number(question.marks)
    const answer = answersByQuestionId.get(question.id)
    const selectedAnswer = answer?.selected_answer ?? null

    let isCorrect = null
    let marksAwarded = 0

    if (selectedAnswer) {
      isCorrect = selectedAnswer === question.correct_answer
      if (isCorrect) {
        marksAwarded = Number(question.marks)
      } else if (negativeMarkingEnabled) {
        marksAwarded = -Number(question.negative_marks)
      }
    }

    score += marksAwarded

    return {
      answerId: answer?.id ?? null,
      questionId: question.id,
      selectedAnswer,
      isCorrect,
      marksAwarded,
    }
  })

  const percentage = totalMarks > 0 ? Math.max(0, (score / totalMarks) * 100) : 0
  const result = percentage >= Number(passingPercentage) ? 'PASS' : 'FAIL'

  return {
    score: Number(score.toFixed(2)),
    totalMarks: Number(totalMarks.toFixed(2)),
    percentage: Number(percentage.toFixed(2)),
    result,
    perQuestion,
  }
}
