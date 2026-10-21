// src/utils/restrictions.ts

export function canUserOrderProduct(
  userCourse: string | undefined | null,
  productOrganization: string | undefined | null,
  _productCategory?: string | undefined | null // Added underscore to fix TS6133 error
): boolean {
  // Kung walang course (e.g., Admin), payagan muna.
  if (!userCourse || !productOrganization) return true;

  const course = userCourse.toUpperCase().trim();
  const org = productOrganization.toUpperCase().trim();
  
  // ✅ RULE 1: General / Institutional items — pwede sa LAHAT ng courses
  if (
    org.includes('INSTITUTIONAL') ||
    org.includes('CSDL') ||
    org.includes('ATHLETIC') ||
    org.includes('NSTP')
  ) {
    return true;
  }

  // ✅ RULE 2: Specific Course Matching (Gagamit tayo ng `.includes` para sure)

  // CITE / IT / Computer Studies
  if (
    course.includes('IT') || 
    course.includes('COMPUTER') || 
    course.includes('CITE') ||
    course.includes('INFORMATION TECHNOLOGY')
  ) {
    return (
      org.includes('CITE') || 
      org.includes('SSITE') || 
      org.includes('CISE')
    );
  }

  // BSA (Accounting)
  if (course.includes('BSA') || course.includes('ACCOUNTANCY')) {
    return org.includes('BSA') || org.includes('JPIA');
  }

  // BSBA (Business Administration)
  if (course.includes('BSBA') || course.includes('BUSINESS')) {
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
  if (course.includes('CRIM') || course.includes('CCJE')) {
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
    return org.includes('BSTM') || org.includes('BSHM');
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
  if (course.includes('CAS') || course.includes('ARTS')) {
    return org.includes('CAS');
  }

  // SHS (Senior High School)
  if (course.includes('SHS') || course.includes('GRADE 11') || course.includes('GRADE 12')) {
    return org.includes('SHS');
  }

  // Default: I-block kung walang tugma
  return false;
}