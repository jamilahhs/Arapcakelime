import React from "react";
import LiveQuizSolver from "./quiz-solver-client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function QuizPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <LiveQuizSolver quizId={resolvedParams.id} />;
}
