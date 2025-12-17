export interface MCQQuestion {
  id: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: "A" | "B" | "C" | "D";
  category: "technical" | "behavioral" | "office_environment";
  difficulty: "easy" | "medium" | "hard";
  explanation: string;
}

interface JobData {
  title: string;
  description: string;
  experience_required?: number;
  skills?: string[];
}

export async function generateMCQQuestions(
  jobData: JobData
): Promise<MCQQuestion[]> {
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3001/api';
  
  try {
    const response = await fetch(`${apiBaseUrl}/public/mcq-tests/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: jobData.title,
        description: jobData.description || '',
        experience_required: jobData.experience_required || 0,
        skills: jobData.skills || [],
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate MCQ questions';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, try to get text
        try {
          const text = await response.text();
          errorMessage = text || errorMessage;
        } catch (textError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError: any) {
      console.error('JSON parse error:', jsonError);
      const text = await response.text();
      console.error('Response text:', text.substring(0, 500));
      throw new Error(`Invalid JSON response from server: ${jsonError.message}`);
    }

    const { questions } = data;

    // Validate we have exactly 30 questions
    if (!questions || !Array.isArray(questions)) {
      throw new Error(`Invalid response format: expected array of questions`);
    }

    if (questions.length !== 30) {
      throw new Error(`Expected 30 questions, got ${questions.length}`);
    }

    return questions;
  } catch (error: any) {
    console.error("Error generating MCQ questions:", error);
    throw new Error(error.message || "Failed to generate MCQ questions. Please try again.");
  }
}

