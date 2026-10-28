// src/utils/restrictions.ts

export function canUserOrderProduct(
  userCourse: string | undefined | null,
  productOrganization: string | undefined | null,
  _productCategory?: string | undefined | null // Nilagyan ng underscore para walang TS6133 error
): boolean {
  // 1. Kung walang session/course (e.g., Admin or Guest), payagan muna.
  if (!userCourse || !productOrganization) return true;

  const course = userCourse.toUpperCase().trim();
  const org = productOrganization.toUpperCase().trim();

  // ============================================================
  // ✅ RULE 1: GENERAL / INSTITUTIONAL ITEMS
  // Pwede sa LAHAT ng courses (ID Laces, PE, Institutional, etc.)
  // ============================================================
  if (
    org.includes('INSTITUTIONAL') ||
    org.includes('GENERAL') ||
    org.includes('ALL') ||
    org.includes('CSDL') ||
    org.includes('ATHLETIC') ||
    org.includes('NSTP') ||
    org === 'SJCM GENERAL'
  ) {
    return true;
  }

  // ============================================================
  // ✅ RULE 2: SPECIFIC COURSE MATCHING
  // ============================================================

  // 🔥 CITE / IT / Computer Studies
  if (
    course.includes('IT') ||
    course.includes('COMPUTER') ||
    course.includes('CITE') ||
    course.includes('INFORMATION TECHNOLOGY') ||
    course.includes('BSIT') ||
    course.includes('BSCS') ||
    course.includes('BSIS')
  ) {
    return (
      org.includes('CITE') ||
      org.includes('SSITE') ||
      org.includes('CISE') ||
      org.includes('CSDL')
    );
  }

  // BSA (Accounting)
  if (
    course.includes('BSA') ||
    course.includes('ACCOUNTANCY')
  ) {
    return org.includes('BSA') || org.includes('JPIA');
  }

  // BSBA (Business Administration)
  if (
    course.includes('BSBA') ||
    course.includes('BUSINESS')
  ) {
    return org.includes('BSBA');
  }

  // COED (Education)
  if (
    course.includes('EDUC') ||
    course.includes('COED') ||
    course.includes('BSED') ||
    course.includes('BEED')
  ) {
    return org.includes('COED');
  }

  // CCJE (Criminology)
  if (
    course.includes('CRIM') ||
    course.includes('CCJE')
  ) {
    return org.includes('CCJE') || org.includes('CRIMINAL JUSTICE');
  }

  // CMA (Hospitality / Tourism)
  if (
    course.includes('HOSPITALITY') ||
    course.includes('TOURISM') ||
    course.includes('CMA') ||
    course.includes('BSTM') ||
    course.includes('BSHM')
  ) {
    return (
      org.includes('BSTM') ||
      org.includes('BSHM') ||
      org.includes('CMA')
    );
  }

  // CAHS (Nursing, MedTech, RadTech)
  if (
    course.includes('NURS') ||
    course.includes('CAHS') ||
    course.includes('BSN') ||
    course.includes('MEDTECH') ||
    course.includes('BSMT') ||
    course.includes('BSRT')
  ) {
    return (
      org.includes('CAHS') ||
      org.includes('BSN') ||
      org.includes('BSRT') ||
      org.includes('BSMT') ||
      org.includes('VANGUARDS')
    );
  }

  // CAS (Arts & Sciences)
  if (
    course.includes('CAS') ||
    course.includes('ARTS')
  ) {
    return org.includes('CAS') || org.includes('ARTS');
  }

  // SHS (Senior High School)
  if (
    course.includes('SHS') ||
    course.includes('GRADE 11') ||
    course.includes('GRADE 12')
  ) {
    return org.includes('SHS');
  }

  // Default: I-block kung walang tugma
  return false;
}