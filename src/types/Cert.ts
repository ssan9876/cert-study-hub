// Certification identity and metadata. The platform is multi-cert: each
// certification supplies its own question bank, flashcards, case studies and
// domain blueprint, plus scoring metadata (scaled-score range and pass mark).

export type CertId = 'az104' | 'secplus';

export interface CertMeta {
  id: CertId;
  /** Full title, e.g. "AZ-104 Microsoft Azure Administrator". */
  name: string;
  /** Short label for chips/sidebar, e.g. "AZ-104". */
  shortName: string;
  /** Exam code, e.g. "AZ-104" or "SY0-701". */
  exam: string;
  vendor: string;
  /** Top of the scaled-score range Microsoft/CompTIA report (e.g. 1000 or 900). */
  scaledMax: number;
  /** Scaled score required to pass (e.g. 700 or 750). */
  passMark: number;
  description: string;
  /** Accent color for cards/branding. */
  accent: string;
}
