import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserFeedback, ProblemReport } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  timestamp: string;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    timestamp: new Date().toISOString(),
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Save user feedback to Firestore database in the /feedbacks collection.
 */
export async function submitUserFeedback(feedback: Omit<UserFeedback, 'id' | 'createdAt'>): Promise<UserFeedback> {
  const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const fullFeedback: UserFeedback = {
    ...feedback,
    id: feedbackId,
    createdAt: new Date().toISOString(),
    appVersion: '2.4.0',
  };

  const path = `feedbacks/${feedbackId}`;
  try {
    const feedbackRef = doc(db, 'feedbacks', feedbackId);
    await setDoc(feedbackRef, {
      id: fullFeedback.id,
      category: fullFeedback.category,
      rating: fullFeedback.rating ?? 5,
      message: fullFeedback.message.trim(),
      userEmail: fullFeedback.userEmail?.trim() || '',
      appVersion: fullFeedback.appVersion,
      createdAt: fullFeedback.createdAt,
    });
    return fullFeedback;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}

/**
 * Save technical problem report to Firestore database in the /problem_reports collection.
 */
export async function submitProblemReport(report: Omit<ProblemReport, 'id' | 'createdAt'>): Promise<ProblemReport> {
  const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const fullReport: ProblemReport = {
    ...report,
    id: reportId,
    createdAt: new Date().toISOString(),
    appVersion: '2.4.0',
  };

  const path = `problem_reports/${reportId}`;
  try {
    const reportRef = doc(db, 'problem_reports', reportId);
    await setDoc(reportRef, {
      id: fullReport.id,
      category: fullReport.category,
      title: fullReport.title?.trim() || 'Technical Problem Report',
      description: fullReport.description.trim(),
      stepsToReproduce: fullReport.stepsToReproduce?.trim() || '',
      userEmail: fullReport.userEmail?.trim() || '',
      appVersion: fullReport.appVersion,
      createdAt: fullReport.createdAt,
    });
    return fullReport;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
    throw err;
  }
}
