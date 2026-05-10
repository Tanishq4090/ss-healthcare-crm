export type SSHealthcareService = {
  id: string;
  name: string;
  category: string;
  description: string;
};

export const SS_HEALTHCARE_SERVICES: SSHealthcareService[] = [
  {
    id: 'home_icu_trained_nursing_staff',
    name: 'Home ICU Trained Nursing Staff',
    category: 'nursing',
    description: 'ICU-trained nursing staff for home healthcare support.',
  },
  {
    id: 'doctor_at_home',
    name: 'Doctor At Home / Doctor Visits',
    category: 'doctor',
    description: 'Doctor visit at home for examination, diagnosis, medication and treatment guidance.',
  },
  {
    id: 'medical_attendant_elder_care',
    name: 'Medical Attendant (Elder Care)',
    category: 'attendant',
    description: 'Medical attendant support for elderly patients, hygiene, daily living, comfort and mobility.',
  },
  {
    id: 'home_physiotherapy',
    name: 'Home Physiotherapy',
    category: 'physiotherapy',
    description: 'Physiotherapy at home to restore mobility, improve muscle strength and functional ability.',
  },
  {
    id: 'ambulance_24_7',
    name: 'Ambulance Service (24/7)',
    category: 'ambulance',
    description: '24/7 ambulance support for sick or injured patients.',
  },
  {
    id: 'dressing_at_home',
    name: 'All Type Of Dressing at Home',
    category: 'procedure',
    description: 'Home dressing and wound-care support.',
  },
  {
    id: 'catheterization_at_home',
    name: 'Catherization at Home',
    category: 'procedure',
    description: 'Catheterization support at home.',
  },
  {
    id: 'injections_at_home',
    name: 'IV / IM / IC Injections at Home',
    category: 'procedure',
    description: 'Intravenous, intramuscular and other injection support at home.',
  },
  {
    id: 'baby_sitter',
    name: 'Baby Sitter',
    category: 'baby_care',
    description: 'Baby sitter and newborn baby care support at home.',
  },
  {
    id: 'medical_equipment',
    name: 'Medical Equipment',
    category: 'equipment',
    description: 'Medical equipment support for home healthcare.',
  },
  {
    id: 'nursing_care_at_home',
    name: 'Nursing Care at Home',
    category: 'nursing',
    description: 'Skilled nursing care at home.',
  },
  {
    id: 'caretaker_service_at_home',
    name: 'Caretaker Service at Home',
    category: 'caretaker',
    description: 'Caretaker support for patients and families at home.',
  },
  {
    id: 'occupational_therapy',
    name: 'Occupational Therapy',
    category: 'therapy',
    description: 'Occupational therapy support as part of home healthcare.',
  },
  {
    id: 'daily_living_assistance',
    name: 'Assistance with Daily Living Activities',
    category: 'attendant',
    description: 'Support with day-to-day activities and patient comfort.',
  },
];
