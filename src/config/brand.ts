export const SS_HEALTHCARE_BRAND = {
  name: 'SS Health Care',
  shortName: 'SS Healthcare',
  productName: 'SS Health Care Admin OS',
  tagline: 'Home Healthcare Operations CRM',
  logoPath: '/logo.png',
  website: 'https://homecareservices.co.in/',
  colors: {
    primary: '#00A859',
    secondary: '#004C8C',
    primaryDark: '#007A43',
    secondaryDark: '#003866',
    surface: '#F4FBF7',
    surfaceBlue: '#EEF6FF',
    text: '#0F172A',
    muted: '#64748B',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #00A859, #004C8C)',
    soft: 'linear-gradient(135deg, rgba(0,168,89,0.12), rgba(0,76,140,0.10))',
    card: 'linear-gradient(180deg, #FFFFFF 0%, #F4FBF7 100%)',
  },
} as const;

export type SSHealthcareBrand = typeof SS_HEALTHCARE_BRAND;
