// ReviewPage — pre-submission review of the active exam. Redirects home if no
// exam is in progress.

import { Navigate, useNavigate } from 'react-router-dom';
import { useExam } from '../../hooks/useExam';
import { ReviewScreen } from '../../components/Review/ReviewScreen';

export function ReviewPage() {
  const navigate = useNavigate();
  const { session, questions, counts, submitExam, setCurrentIndex } = useExam();

  if (!session) return <Navigate to="/exam" replace />;

  return (
    <ReviewScreen
      questions={questions}
      responses={session.responses}
      counts={counts}
      currentIndex={session.currentIndex}
      onJump={(i) => setCurrentIndex(i)}
      onBack={() => navigate('/exam')}
      onSubmit={() => {
        submitExam();
        navigate('/results');
      }}
    />
  );
}
