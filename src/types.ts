/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExamCenter {
  id: string; // Internal id
  code: string; // Center Code (e.g., CENT001)
  name: string; // Center Name (परीक्षा केंद्र का नाम)
  capacity: number; // Required number of officers (कितना ऑफिसर लगाना है)
  assignedOfficerIds: string[]; // List of assigned officer IDs
}

export interface Officer {
  id: string; // Unique ID
  name: string; // Officer Name (अधिकारी का नाम)
  designation: string; // Designation (पद)
  department: string; // Department/Office (विभाग / कार्यालय)
  mobile: string; // Contact Mobile Number (मोबाइल नंबर)
  assignedCenterCode: string | null; // Center code where they are assigned (assigned duty)
}

export type TabType = 'upload' | 'centers' | 'officers' | 'randomize' | 'results';
