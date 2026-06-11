import { ExamCenter, Officer } from '../types';

/**
 * Fisher-Yates Shuffle Algorithm for unbiased shuffling
 */
export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface RandomizationOptions {
  avoidSameDepartment: boolean; // Avoid putting officers from the same department in the same center
  seed?: number;
}

/**
 * Randomize officers into exam centers
 * Returns the updated lists of centers and officers
 */
export function performRandomization(
  centers: ExamCenter[],
  officers: Officer[],
  options: RandomizationOptions
): { updatedCenters: ExamCenter[]; updatedOfficers: Officer[]; unassignedOfficers: Officer[] } {
  // Deep copy elements to avoid mutation
  const centersCopy: ExamCenter[] = centers.map(c => ({ ...c, assignedOfficerIds: [] }));
  const officersCopy: Officer[] = officers.map(o => ({ ...o, assignedCenterCode: null }));

  // Shuffle the officers initially to guarantee randomness
  let primaryPool = shuffle(officersCopy);

  // Group officers by department to perform smart separation if enabled
  if (options.avoidSameDepartment) {
    // We want to distribute officers of the same department across different centers.
    // A great way to do this is to group officers by department, and build a list where we interleaved them.
    const deptMap: { [key: string]: Officer[] } = {};
    primaryPool.forEach(officer => {
      const dept = officer.department || 'Unknown';
      if (!deptMap[dept]) {
        deptMap[dept] = [];
      }
      deptMap[dept].push(officer);
    });

    // Sort departments by size to interleave the largest departments first
    const sortedDepts = Object.keys(deptMap).sort(
      (a, b) => deptMap[b].length - deptMap[a].length
    );

    const interleaved: Officer[] = [];
    let hasMore = true;
    let index = 0;
    while (hasMore) {
      hasMore = false;
      for (const dept of sortedDepts) {
        if (index < deptMap[dept].length) {
          interleaved.push(deptMap[dept][index]);
          hasMore = true;
        }
      }
      index++;
    }
    primaryPool = interleaved;
  }

  // To maintain pure absolute randomness, let's process assignment
  // We'll iterate over the centers and try to fill them
  // Keep track of which officers are assigned
  const assignedSet = new Set<string>();

  for (const center of centersCopy) {
    const needed = center.capacity;
    let assignedCount = 0;

    // First, if smart/department avoidance is ON, we try to grab officers
    // that don't share a department with already assigned officers in this specific center
    if (options.avoidSameDepartment) {
      const currentDeptsInCenter = new Set<string>();
      
      // Attempt to fill using different departments first
      for (let i = 0; i < primaryPool.length; i++) {
        const officer = primaryPool[i];
        if (assignedSet.has(officer.id)) continue;

        if (!currentDeptsInCenter.has(officer.department)) {
          // Assign this officer
          center.assignedOfficerIds.push(officer.id);
          assignedSet.add(officer.id);
          currentDeptsInCenter.add(officer.department);
          
          // Update officer assignment in officers list
          const originalOfficer = officersCopy.find(o => o.id === officer.id);
          if (originalOfficer) {
            originalOfficer.assignedCenterCode = center.code;
          }
          
          assignedCount++;
          if (assignedCount >= needed) break;
        }
      }
    }

    // If still have remaining slots (because we disabled avoidance OR we couldn't find unique depts),
    // fill them with any remaining unassigned officers
    if (assignedCount < needed) {
      for (let i = 0; i < primaryPool.length; i++) {
        const officer = primaryPool[i];
        if (assignedSet.has(officer.id)) continue;

        center.assignedOfficerIds.push(officer.id);
        assignedSet.add(officer.id);

        const originalOfficer = officersCopy.find(o => o.id === officer.id);
        if (originalOfficer) {
          originalOfficer.assignedCenterCode = center.code;
        }

        assignedCount++;
        if (assignedCount >= needed) break;
      }
    }
  }

  // Split into assigned and unassigned/reserve list
  const unassignedOfficers = officersCopy.filter(o => o.assignedCenterCode === null);

  return {
    updatedCenters: centersCopy,
    updatedOfficers: officersCopy,
    unassignedOfficers
  };
}
